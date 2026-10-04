import React, { useState, useMemo } from 'react';
import type { Subscription, Category } from '../types/subscription';
import { SubscriptionCard } from './SubscriptionCard';
import {
  getMonthlyEquivalent,
  getDaysUntilNextBilling,
  assessWasteRisk,
} from '../utils/calculations';
import { CATEGORIES } from '../utils/constants';
import { Search, Plus, Sparkles, AlertCircle } from 'lucide-react';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onUpdate: (sub: Subscription) => void;
  onAddNew: () => void;
}

type FilterTab = 'all' | 'upcoming' | 'waste' | 'trial' | 'active';
type SortOption = 'date_asc' | 'date_desc' | 'price_desc' | 'price_asc' | 'satisfaction_asc' | 'name';

export const SubscriptionList: React.FC<SubscriptionListProps> = ({
  subscriptions,
  onEdit,
  onDelete,
  onUpdate,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_asc');

  // 各種カウント
  const counts = useMemo(() => {
    let upcoming = 0;
    let waste = 0;
    let trial = 0;
    let active = 0;

    for (const s of subscriptions) {
      if (s.status === 'active' || s.status === 'trial') {
        active++;
      }
      const days = getDaysUntilNextBilling(s.nextBillingDate);
      if (days >= 0 && days <= 7 && s.status !== 'canceled') {
        upcoming++;
      }
      if (assessWasteRisk(s).isWaste) {
        waste++;
      }
      if (s.status === 'trial') {
        trial++;
      }
    }
    return { all: subscriptions.length, upcoming, waste, trial, active };
  }, [subscriptions]);

  // フィルタリング & ソート
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((sub) => {
        // 検索クエリ
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = sub.name.toLowerCase().includes(q);
          const matchMethod = sub.paymentMethod.toLowerCase().includes(q);
          const matchMemo = (sub.memo || '').toLowerCase().includes(q);
          if (!matchName && !matchMethod && !matchMemo) return false;
        }

        // タブフィルター
        if (activeTab === 'upcoming') {
          const days = getDaysUntilNextBilling(sub.nextBillingDate);
          if (days < 0 || days > 7 || sub.status === 'canceled') return false;
        } else if (activeTab === 'waste') {
          if (!assessWasteRisk(sub).isWaste) return false;
        } else if (activeTab === 'trial') {
          if (sub.status !== 'trial') return false;
        } else if (activeTab === 'active') {
          if (sub.status === 'canceled' || sub.status === 'paused') return false;
        }

        // カテゴリフィルター
        if (selectedCategory !== 'all') {
          if (sub.category !== selectedCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date_asc':
            return getDaysUntilNextBilling(a.nextBillingDate) - getDaysUntilNextBilling(b.nextBillingDate);
          case 'date_desc':
            return getDaysUntilNextBilling(b.nextBillingDate) - getDaysUntilNextBilling(a.nextBillingDate);
          case 'price_desc':
            return getMonthlyEquivalent(b) - getMonthlyEquivalent(a);
          case 'price_asc':
            return getMonthlyEquivalent(a) - getMonthlyEquivalent(b);
          case 'satisfaction_asc':
            return a.satisfaction - b.satisfaction;
          case 'name':
            return a.name.localeCompare(b.name, 'ja');
          default:
            return 0;
        }
      });
  }, [subscriptions, searchQuery, activeTab, selectedCategory, sortBy]);

  return (
    <div className="space-y-4">
      {/* 検索・操作ツールバー */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* 検索バー */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="サブスク名、決済方法、メモで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* フィルター＆ソートコントロール */}
          <div className="flex items-center gap-2">
            {/* カテゴリセレクト */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as Category | 'all')}
                className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">すべてのカテゴリ</option>
                {Object.values(CATEGORIES).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ソートセレクト */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-7 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="date_asc">更新が近い順</option>
                <option value="price_desc">月額が高い順</option>
                <option value="price_asc">月額が安い順</option>
                <option value="satisfaction_asc">満足度が低い順</option>
                <option value="name">サービス名順</option>
              </select>
            </div>
          </div>
        </div>

        {/* タブ切り替えバー */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            すべて ({counts.all})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeTab === 'upcoming'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>7日以内更新</span>
            <span className="font-bold">({counts.upcoming})</span>
          </button>
          <button
            onClick={() => setActiveTab('waste')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeTab === 'waste'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>解約推奨</span>
            <span className="font-bold">({counts.waste})</span>
          </button>
          <button
            onClick={() => setActiveTab('trial')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'trial'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            無料体験中 ({counts.trial})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'active'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            契約中のみ ({counts.active})
          </button>
        </div>
      </div>

      {/* サブスクカード一覧 */}
      {filteredSubscriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-700 mb-1">
            該当するサブスクが見つかりませんでした
          </h4>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            検索キーワードやフィルター条件を変更するか、新しいサブスクを登録してください。
          </p>
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>新しいサブスクを追加する</span>
          </button>
        </div>
      )}
    </div>
  );
};
