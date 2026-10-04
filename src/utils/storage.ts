import type { Subscription } from '../types/subscription';

const STORAGE_KEY = 'subtrack_subscriptions_v1';

/**
 * 初期サンプルデータ
 */
export function getInitialSampleData(): Subscription[] {
  const today = new Date();
  
  // 今月・来月の日付ヘルパー
  const getDateStr = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return [
    {
      id: 'sub-netflix',
      name: 'Netflix',
      price: 1490,
      currency: 'JPY',
      cycle: 'monthly',
      category: 'video',
      status: 'active',
      nextBillingDate: getDateStr(3), // 3日後 (間近警告)
      paymentMethod: '楽天カード (末尾4219)',
      cancelUrl: 'https://www.netflix.com/youraccount',
      cancelProcedureNote: 'Webブラウザのアカウント設定から解約。次回請求日まではそのまま視聴可能。',
      usageFrequency: 'daily',
      satisfaction: 5,
      memo: 'スタンダードプラン。家族も利用。必須。',
      notifyDaysBefore: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub-chatgpt',
      name: 'ChatGPT Plus',
      price: 3000,
      currency: 'JPY',
      cycle: 'monthly',
      category: 'software',
      status: 'active',
      nextBillingDate: getDateStr(18),
      paymentMethod: '三井住友カード (末尾8890)',
      cancelUrl: 'https://chatgpt.com/#settings',
      cancelProcedureNote: '左下メニュー「設定」→「サブスクリプションの管理」から。',
      usageFrequency: 'daily',
      satisfaction: 5,
      memo: '業務・プライベート両面でフル活用中。',
      notifyDaysBefore: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub-adobe',
      name: 'Adobe Creative Cloud',
      price: 6578,
      currency: 'JPY',
      cycle: 'monthly',
      category: 'software',
      status: 'active',
      nextBillingDate: getDateStr(5), // 5日後
      paymentMethod: '三井住友カード (末尾8890)',
      cancelUrl: 'https://account.adobe.com/plans',
      cancelProcedureNote: '年間プラン月々払いは途中解約時に解約料がかかる規約に注意。',
      usageFrequency: 'rare',
      satisfaction: 2, // 満足度低・あまり使っていない → 断捨離候補！
      memo: 'Photoshop目的で契約したが最近Canvaばかりで触っていない。解約検討中。',
      notifyDaysBefore: 7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub-chocozap',
      name: 'chocoZAP (チョコザップ)',
      price: 3278,
      currency: 'JPY',
      cycle: 'monthly',
      category: 'fitness',
      status: 'active',
      nextBillingDate: getDateStr(1), // 明日！
      paymentMethod: '楽天カード (末尾4219)',
      cancelProcedureNote: 'アプリのマイページから手続き。毎月10日締めで当月末退会。',
      usageFrequency: 'rare',
      satisfaction: 1, // 満足度1・使ってない → 緊急解約推奨！
      memo: '入会したものの3ヶ月間1度も行っていない。早く解約したい。',
      notifyDaysBefore: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub-spotify',
      name: 'Spotify Premium',
      price: 980,
      currency: 'JPY',
      cycle: 'monthly',
      category: 'music',
      status: 'active',
      nextBillingDate: getDateStr(12),
      paymentMethod: '三井住友カード (末尾8890)',
      cancelUrl: 'https://www.spotify.com/account/overview/',
      cancelProcedureNote: 'Webのアカウント概要「プランを変更」からFreeプランに切替。',
      usageFrequency: 'weekly',
      satisfaction: 4,
      memo: '通勤時によく聴く。満足。',
      notifyDaysBefore: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub-amazon',
      name: 'Amazon Prime',
      price: 5900,
      currency: 'JPY',
      cycle: 'yearly',
      category: 'lifestyle',
      status: 'active',
      nextBillingDate: getDateStr(45),
      paymentMethod: 'Amazon Mastercard',
      cancelUrl: 'https://www.amazon.co.jp/mc/manage',
      cancelProcedureNote: 'プライム会員情報より手続き。',
      usageFrequency: 'daily',
      satisfaction: 5,
      memo: 'お急ぎ便とPrime Videoで十分元取れている。年払い継続。',
      notifyDaysBefore: 7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sub-kindle',
      name: 'Kindle Unlimited',
      price: 980,
      currency: 'JPY',
      cycle: 'monthly',
      category: 'reading',
      status: 'trial', // 無料体験中
      nextBillingDate: getDateStr(6),
      paymentMethod: 'Amazon Mastercard',
      cancelUrl: 'https://www.amazon.co.jp/kindle-dbs/ku/ku-central',
      cancelProcedureNote: 'Kindle Unlimited会員登録管理より解約。体験期間終了まで読める。',
      usageFrequency: 'monthly',
      satisfaction: 3,
      memo: '30日間無料体験中。終了前に解約しないと自動課金される！',
      notifyDaysBefore: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
}

/**
 * サブスク一覧読み込み
 */
export function loadSubscriptions(): Subscription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSampleData();
      saveSubscriptions(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return getInitialSampleData();
  } catch (e) {
    console.error('Failed to load subscriptions from localStorage:', e);
    return getInitialSampleData();
  }
}

/**
 * サブスク一覧保存
 */
export function saveSubscriptions(subscriptions: Subscription[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  } catch (e) {
    console.error('Failed to save subscriptions to localStorage:', e);
  }
}

/**
 * JSONファイルとしてエクスポート
 */
export function exportSubscriptionsAsJson(subscriptions: Subscription[]): void {
  const jsonStr = JSON.stringify(subscriptions, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `subtrack-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * CSVファイルとしてエクスポート
 */
export function exportSubscriptionsAsCsv(subscriptions: Subscription[]): void {
  const header = ['ID', 'サービス名', '金額', '通貨', '請求周期', 'カテゴリ', 'ステータス', '次回更新日', '決済方法', '満足度', '利用頻度', '解約URL', 'メモ'];
  const rows = subscriptions.map((s) => [
    s.id,
    `"${s.name.replace(/"/g, '""')}"`,
    s.price,
    s.currency,
    s.cycle,
    s.category,
    s.status,
    s.nextBillingDate,
    `"${s.paymentMethod.replace(/"/g, '""')}"`,
    s.satisfaction,
    s.usageFrequency,
    `"${(s.cancelUrl || '').replace(/"/g, '""')}"`,
    `"${(s.memo || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `subtrack-export-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
