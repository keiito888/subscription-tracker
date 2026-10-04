import React, { useState } from 'react';
import type { Subscription } from '../types/subscription';
import {
  assessWasteRisk,
  getMonthlyEquivalent,
  getYearlyEquivalent,
  formatCurrency,
  getDaysUntilNextBilling,
} from '../utils/calculations';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  ExternalLink,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface WasteCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  onUpdateSubscription: (sub: Subscription) => void;
}

export const WasteCleanerModal: React.FC<WasteCleanerModalProps> = ({
  isOpen,
  onClose,
  subscriptions,
  onUpdateSubscription,
}) => {
  const [justCanceledIds, setJustCanceledIds] = useState<string[]>([]);

  if (!isOpen) return null;

  // 断捨離候補アイテム抽出
  const wasteList = subscriptions
    .filter((s) => s.status !== 'canceled')
    .map((s) => ({
      sub: s,
      assessment: assessWasteRisk(s),
      monthly: getMonthlyEquivalent(s),
      yearly: getYearlyEquivalent(s),
      daysLeft: getDaysUntilNextBilling(s.nextBillingDate),
    }))
    .filter((item) => item.assessment.isWaste || item.sub.status === 'canceling')
    .sort((a, b) => b.assessment.score - a.assessment.score);

  // 節約可能総額
  const totalMonthlyPotential = wasteList.reduce((acc, item) => acc + item.monthly, 0);
  const totalYearlyPotential = totalMonthlyPotential * 12;

  // 今回のセッションで解約達成した金額
  const savedAnnualSoFar = subscriptions
    .filter((s) => justCanceledIds.includes(s.id))
    .reduce((acc, s) => acc + getYearlyEquivalent(s), 0);

  // 解約完了ハンドラ (紙吹雪エフェクト発火！)
  const handleMarkCanceled = (sub: Subscription) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setJustCanceledIds((prev) => [...prev, sub.id]);
    onUpdateSubscription({
      ...sub,
      status: 'canceled',
      updatedAt: new Date().toISOString(),
    });
  };

  // 解約予定へ切り替え
  const handleMarkCanceling = (sub: Subscription) => {
    onUpdateSubscription({
      ...sub,
      status: 'canceling',
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                無駄サブスク断捨離シミュレーター
              </h3>
              <p className="text-xs text-slate-500">
                満足度が低い・使っていないサブスクを整理して固定費を削減
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 節約シミュレーション看板 */}
        <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-lg shadow-rose-200">
          <div className="flex items-center justify-between text-xs text-rose-100 mb-1">
            <span>見直すだけで削減できる固定費</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold">
              候補 {wasteList.length} 件
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight">
              {formatCurrency(totalYearlyPotential)}
            </span>
            <span className="text-sm font-semibold text-rose-100">/ 年間の節約</span>
          </div>
          <p className="text-xs text-rose-100 mt-2">
            月々 {formatCurrency(totalMonthlyPotential)} の手取りが増えるのと同じ効果があります！
          </p>

          {savedAnnualSoFar > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-amber-200">
              <span>🎉 今回の整理で年間削減達成:</span>
              <span className="text-base text-white font-black">
                +{formatCurrency(savedAnnualSoFar)} /年
              </span>
            </div>
          )}
        </div>

        {/* 候補リスト */}
        <div className="mt-5 space-y-3 max-h-96 overflow-y-auto pr-1">
          {wasteList.length > 0 ? (
            wasteList.map(({ sub, assessment, daysLeft, monthly, yearly }) => {
              const isCanceling = sub.status === 'canceling';

              return (
                <div
                  key={sub.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCanceling
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{sub.name}</h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            assessment.severity === 'high'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          断捨離推奨 (スコア {assessment.score})
                        </span>
                      </div>
                      <p className="text-xs text-rose-600 font-medium mt-0.5">
                        {assessment.reason}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-slate-900">
                        {formatCurrency(yearly)} /年
                      </div>
                      <div className="text-xs text-slate-500">
                        ({formatCurrency(monthly)}/月)
                      </div>
                    </div>
                  </div>

                  {/* 次回更新日と手順 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs py-2 border-t border-slate-100 mt-2">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>次回更新: {sub.nextBillingDate}</span>
                      <span className="font-bold text-slate-800">
                        ({daysLeft === 0 ? '本日！' : `あと${daysLeft}日`})
                      </span>
                    </div>

                    {sub.cancelProcedureNote && (
                      <span className="text-[11px] text-slate-500 italic max-w-xs truncate">
                        💡 {sub.cancelProcedureNote}
                      </span>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-1">
                    {sub.cancelUrl ? (
                      <a
                        href={sub.cancelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold underline"
                      >
                        <span>解約ページを開く</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">解約URL未登録</span>
                    )}

                    <div className="flex items-center gap-2">
                      {!isCanceling && (
                        <button
                          type="button"
                          onClick={() => handleMarkCanceling(sub)}
                          className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors"
                        >
                          解約予定にする
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleMarkCanceled(sub)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>解約完了！</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-emerald-50/50 border border-emerald-200 rounded-2xl">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-bold text-emerald-900 text-sm">無駄なサブスクはありません！</h4>
              <p className="text-xs text-emerald-700 mt-1">
                現在登録されているすべてのサブスクは満足度が高く、定期的に活用されています。素晴らしい管理状態です！
              </p>
            </div>
          )}
        </div>

        {/* 閉じるボタン */}
        <div className="pt-4 border-t border-slate-100 mt-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};
