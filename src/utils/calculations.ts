import type { Subscription, BillingCycle, Currency } from '../types/subscription';

/**
 * 月額換算値を算出
 */
export function getMonthlyEquivalent(sub: Pick<Subscription, 'price' | 'cycle'>): number {
  switch (sub.cycle) {
    case 'monthly':
      return sub.price;
    case 'yearly':
      return Math.round(sub.price / 12);
    case 'quarterly':
      return Math.round(sub.price / 3);
    case 'weekly':
      return Math.round(sub.price * 4.33);
    default:
      return sub.price;
  }
}

/**
 * 年額換算値を算出
 */
export function getYearlyEquivalent(sub: Pick<Subscription, 'price' | 'cycle'>): number {
  switch (sub.cycle) {
    case 'monthly':
      return sub.price * 12;
    case 'yearly':
      return sub.price;
    case 'quarterly':
      return sub.price * 4;
    case 'weekly':
      return Math.round(sub.price * 52);
    default:
      return sub.price * 12;
  }
}

/**
 * 次回更新日までの残り日数を取得 (今日 = 0, 明日 = 1)
 */
export function getDaysUntilNextBilling(nextDateStr: string): number {
  if (!nextDateStr) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = nextDateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 次回更新日を進める
 */
export function advanceBillingDate(dateStr: string, cycle: BillingCycle): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  switch (cycle) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
  }

  const newY = date.getFullYear();
  const newM = String(date.getMonth() + 1).padStart(2, '0');
  const newD = String(date.getDate()).padStart(2, '0');
  return `${newY}-${newM}-${newD}`;
}

/**
 * 無駄サブスク判定 (断捨離候補・解約推奨判定)
 */
export interface WasteRiskAssessment {
  isWaste: boolean;
  score: number; // 0-100 (高いほど解約推奨度が高い)
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

export function assessWasteRisk(sub: Subscription): WasteRiskAssessment {
  // 解約済み・一時停止は対象外
  if (sub.status === 'canceled' || sub.status === 'paused') {
    return { isWaste: false, score: 0, reason: '', severity: 'low' };
  }

  const monthlyPrice = getMonthlyEquivalent(sub);
  let score = 0;
  const reasons: string[] = [];

  // 満足度による加点
  if (sub.satisfaction === 1) {
    score += 45;
    reasons.push('満足度が極めて低い (★1)');
  } else if (sub.satisfaction === 2) {
    score += 30;
    reasons.push('満足度が低い (★2)');
  }

  // 利用頻度による加点
  if (sub.usageFrequency === 'rare') {
    score += 40;
    reasons.push('ほとんど利用していない');
  } else if (sub.usageFrequency === 'monthly') {
    score += 20;
    reasons.push('月数回しか利用していない');
  }

  // 価格インパクト加点
  if (monthlyPrice >= 3000) {
    score += 15;
    if (sub.satisfaction <= 2 || sub.usageFrequency === 'rare') {
      reasons.push(`月額換算 ${formatCurrency(monthlyPrice)} と高額`);
    }
  }

  // 無料体験中で解約検討
  if (sub.status === 'trial') {
    score += 10;
  }

  const isWaste = score >= 40;
  const severity: 'high' | 'medium' | 'low' = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  return {
    isWaste,
    score,
    reason: reasons.join(' / ') || '定期的な見直しを推奨',
    severity,
  };
}

/**
 * 通貨フォーマット (JPY, USD, EUR)
 */
export function formatCurrency(amount: number, currency: Currency = 'JPY'): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'EUR') {
    return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `¥${Math.round(amount).toLocaleString()}`;
}
