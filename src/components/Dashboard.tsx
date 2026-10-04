import type { Subscription } from '../types/subscription';
import {
  getMonthlyEquivalent,
  getYearlyEquivalent,
  formatCurrency,
  getDaysUntilNextBilling,
  assessWasteRisk,
} from '../utils/calculations';
import { CATEGORIES } from '../utils/constants';
import {
  CreditCard,
  AlertTriangle,
  Calendar,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface DashboardProps {
  subscriptions: Subscription[];
  onOpenWasteModal: () => void;
  onSelectSubscription?: (sub: Subscription) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  subscriptions,
  onOpenWasteModal,
  onSelectSubscription,
}) => {
  // アクティブなサブスクのみ集計
  const activeSubs = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'trial' || s.status === 'canceling'
  );

  const totalMonthly = activeSubs.reduce((acc, s) => acc + getMonthlyEquivalent(s), 0);
  const totalYearly = activeSubs.reduce((acc, s) => acc + getYearlyEquivalent(s), 0);

  // 7日以内の更新予定
  const upcomingSubs = activeSubs
    .map((s) => ({ sub: s, daysLeft: getDaysUntilNextBilling(s.nextBillingDate) }))
    .filter((item) => item.daysLeft >= 0 && item.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // 無駄サブスク（断捨離候補）の集計
  const wasteItems = activeSubs
    .map((s) => ({ sub: s, assessment: assessWasteRisk(s) }))
    .filter((item) => item.assessment.isWaste);

  const wasteMonthlySavings = wasteItems.reduce(
    (acc, item) => acc + getMonthlyEquivalent(item.sub),
    0
  );
  const wasteYearlySavings = wasteMonthlySavings * 12;

  // カテゴリ別集計
  const categoryTotals: Record<string, { total: number; count: number }> = {};
  for (const sub of activeSubs) {
    const monthly = getMonthlyEquivalent(sub);
    if (!categoryTotals[sub.category]) {
      categoryTotals[sub.category] = { total: 0, count: 0 };
    }
    categoryTotals[sub.category].total += monthly;
    categoryTotals[sub.category].count += 1;
  }

  const sortedCategories = Object.entries(categoryTotals)
    .map(([catKey, data]) => ({
      catKey,
      info: CATEGORIES[catKey as keyof typeof CATEGORIES] || CATEGORIES.other,
      total: data.total,
      count: data.count,
      percent: totalMonthly > 0 ? (data.total / totalMonthly) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* 4分割メイン指標カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 月額換算 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">月額換算 合計</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(totalMonthly)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            契約数: <span className="font-semibold text-slate-700">{activeSubs.length}件</span>
          </div>
        </div>

        {/* 年間総コスト */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">年間総支出 予測</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              ¥
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(totalYearly)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            月平均: <span className="font-semibold text-slate-700">{formatCurrency(totalMonthly)}</span>
          </div>
        </div>

        {/* 更新間近アラート */}
        <div
          className={`p-5 rounded-2xl border shadow-sm transition-colors ${
            upcomingSubs.length > 0
              ? 'bg-amber-50/60 border-amber-200 text-amber-900'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              7日以内の更新
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                upcomingSubs.length > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {upcomingSubs.length}
            <span className="text-sm font-normal text-slate-600 ml-1">件</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 truncate">
            {upcomingSubs.length > 0 ? (
              <span>最速: {upcomingSubs[0].sub.name} (あと{upcomingSubs[0].daysLeft}日)</span>
            ) : (
              <span>直近の更新予定なし</span>
            )}
          </div>
        </div>

        {/* 断捨離ポテンシャル（節約可能額） */}
        <div
          onClick={onOpenWasteModal}
          className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 p-5 rounded-2xl shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              節約ポテンシャル
            </span>
            <span className="text-xs font-bold bg-rose-200/80 text-rose-800 px-2 py-0.5 rounded-full">
              {wasteItems.length}件
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 tracking-tight">
            {formatCurrency(wasteYearlySavings)}
            <span className="text-xs font-normal text-rose-600 ml-1">/年</span>
          </div>
          <div className="flex items-center justify-between text-xs text-rose-700 font-medium mt-2">
            <span>不要サブスク削減診断</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 直近更新のアラートバナー (ある場合のみ強調表示) */}
      {upcomingSubs.length > 0 && (
        <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="font-bold text-amber-900 text-sm sm:text-base">
              まもなく更新！解約・見直し確認アラート ({upcomingSubs.length}件)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {upcomingSubs.map(({ sub, daysLeft }) => (
              <div
                key={sub.id}
                className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-sm truncate">{sub.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        daysLeft <= 1
                          ? 'bg-rose-100 text-rose-700 animate-bounce'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {daysLeft === 0 ? '本日更新！' : `あと${daysLeft}日`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    更新日: <span className="font-semibold text-slate-700">{sub.nextBillingDate}</span> /{' '}
                    <span className="font-semibold text-slate-800">{formatCurrency(sub.price, sub.currency)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  {sub.cancelUrl ? (
                    <a
                      href={sub.cancelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold underline"
                    >
                      解約ページ直通
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">解約URL未設定</span>
                  )}
                  {onSelectSubscription && (
                    <button
                      onClick={() => onSelectSubscription(sub)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                    >
                      詳細確認
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* カテゴリ別内訳 */}
      {sortedCategories.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span>カテゴリ別支出割合</span>
            <span className="text-xs font-normal text-slate-500">月額換算ベース</span>
          </h3>

          {/* ビジュアル積層バー */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex mb-4">
            {sortedCategories.map(({ catKey, info, percent }) => (
              <div
                key={catKey}
                style={{ width: `${percent}%`, backgroundColor: info.color }}
                className="h-full transition-all hover:opacity-80"
                title={`${info.name}: ${percent.toFixed(1)}%`}
              />
            ))}
          </div>

          {/* カテゴリごとのリスト */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sortedCategories.map(({ catKey, info, total, count, percent }) => (
              <div
                key={catKey}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: info.color }}
                  />
                  <span className="text-xs font-semibold text-slate-700 truncate">{info.name}</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(total)}/月</span>
                  <span className="text-[11px] text-slate-400">
                    {count}件 ({percent.toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
