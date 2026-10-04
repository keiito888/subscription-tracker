import React from 'react';
import type { Subscription } from '../types/subscription';
import {
  getMonthlyEquivalent,
  formatCurrency,
  getDaysUntilNextBilling,
  advanceBillingDate,
  assessWasteRisk,
} from '../utils/calculations';
import { CATEGORIES, CYCLE_LABELS, STATUS_LABELS, FREQUENCY_LABELS } from '../utils/constants';
import { generateGoogleCalendarUrl } from '../utils/calendar';
import {
  ExternalLink,
  Edit2,
  Trash2,
  CalendarPlus,
  RefreshCw,
  Star,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onUpdate: (sub: Subscription) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onEdit,
  onDelete,
  onUpdate,
}) => {
  const categoryInfo = CATEGORIES[subscription.category] || CATEGORIES.other;
  const cycleInfo = CYCLE_LABELS[subscription.cycle] || CYCLE_LABELS.monthly;
  const statusInfo = STATUS_LABELS[subscription.status] || STATUS_LABELS.active;
  const daysLeft = getDaysUntilNextBilling(subscription.nextBillingDate);
  const monthlyEq = getMonthlyEquivalent(subscription);
  const wasteRisk = assessWasteRisk(subscription);

  // 次回日付へワンクリックで進める（今月分の支払いが済んだ場合）
  const handleAdvanceDate = () => {
    const nextDate = advanceBillingDate(subscription.nextBillingDate, subscription.cycle);
    onUpdate({
      ...subscription,
      nextBillingDate: nextDate,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
        wasteRisk.isWaste
          ? 'border-rose-300 ring-1 ring-rose-200'
          : daysLeft <= 3 && subscription.status !== 'canceled'
          ? 'border-amber-300 ring-1 ring-amber-200'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      <div className="p-5">
        {/* ヘッダー: カテゴリとステータス */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${categoryInfo.bgColor} ${categoryInfo.textColor} ${categoryInfo.borderColor}`}
          >
            {categoryInfo.name}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusInfo.badgeClass}`}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* サービス名と金額 */}
        <div className="mb-3">
          <h4 className="text-lg font-bold text-slate-900 truncate" title={subscription.name}>
            {subscription.name}
          </h4>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(subscription.price, subscription.currency)}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ {cycleInfo.short}</span>
            {subscription.cycle !== 'monthly' && (
              <span className="text-xs text-slate-400">
                (月額換算 {formatCurrency(monthlyEq, subscription.currency)})
              </span>
            )}
          </div>
        </div>

        {/* 次回更新日とカウントダウン */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">次回請求日:</span>
            <span className="font-bold text-slate-800">{subscription.nextBillingDate}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">残り日数:</span>
            <span
              className={`font-bold px-1.5 py-0.2 rounded text-[11px] ${
                daysLeft < 0
                  ? 'bg-slate-200 text-slate-700'
                  : daysLeft === 0
                  ? 'bg-rose-100 text-rose-700 font-extrabold'
                  : daysLeft <= 3
                  ? 'bg-amber-100 text-amber-800 font-extrabold'
                  : 'text-emerald-700 font-semibold'
              }`}
            >
              {daysLeft < 0
                ? `${Math.abs(daysLeft)}日超過`
                : daysLeft === 0
                ? '本日請求！'
                : `あと ${daysLeft} 日`}
            </span>
          </div>
        </div>

        {/* 決済方法 & 満足度 & 頻度 */}
        <div className="space-y-1.5 text-xs text-slate-600 mb-3">
          <div className="flex items-center gap-1.5 truncate">
            <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{subscription.paymentMethod || '未設定'}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= subscription.satisfaction
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
              {FREQUENCY_LABELS[subscription.usageFrequency]?.label || '未設定'}
            </span>
          </div>
        </div>

        {/* 解約推奨・無駄警告バッジ */}
        {wasteRisk.isWaste && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 mb-3 text-xs">
            <div className="flex items-center gap-1 text-rose-700 font-bold mb-0.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>解約・見直し推奨</span>
            </div>
            <p className="text-[11px] text-rose-600 leading-tight">{wasteRisk.reason}</p>
          </div>
        )}

        {/* メモ */}
        {subscription.memo && (
          <p className="text-xs text-slate-500 italic bg-slate-50/80 p-2 rounded-lg border border-slate-100 mb-2 truncate">
            {subscription.memo}
          </p>
        )}
      </div>

      {/* フッターアクションバー */}
      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1">
        {/* 解約リンク */}
        {subscription.cancelUrl ? (
          <a
            href={subscription.cancelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
            title="解約手続きページを開く"
          >
            <span>解約ページ</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-[11px] text-slate-400">解約URLなし</span>
        )}

        <div className="flex items-center gap-1">
          {/* 更新日を次期へ進める */}
          <button
            onClick={handleAdvanceDate}
            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            title={`次回請求日を1周期先(${cycleInfo.label})へ繰り延べる`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Google カレンダーに追加 */}
          <a
            href={generateGoogleCalendarUrl(subscription)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Googleカレンダーにリマインダー追加"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
          </a>

          {/* 編集 */}
          <button
            onClick={() => onEdit(subscription)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            title="編集"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* 削除 */}
          <button
            onClick={() => onDelete(subscription.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="削除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
