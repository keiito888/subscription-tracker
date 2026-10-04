import React, { useState, useEffect } from 'react';
import type { Subscription } from './types/subscription';
import { loadSubscriptions, saveSubscriptions } from './utils/storage';
import { assessWasteRisk, getDaysUntilNextBilling } from './utils/calculations';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { SubscriptionList } from './components/SubscriptionList';
import { SubscriptionModal } from './components/SubscriptionModal';
import { MoneyForwardModal } from './components/MoneyForwardModal';
import { WasteCleanerModal } from './components/WasteCleanerModal';
import { CalendarModal } from './components/CalendarModal';
import { BackupModal } from './components/BackupModal';

export const App: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // モーダル表示状態
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [isMfOpen, setIsMfOpen] = useState(false);
  const [isWasteOpen, setIsWasteOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // 初回読み込み
  useEffect(() => {
    const loaded = loadSubscriptions();
    setSubscriptions(loaded);
    setIsLoaded(true);

    // 更新間近通知チェック
    if ('Notification' in window && Notification.permission === 'granted') {
      const urgent = loaded.filter((s) => {
        const d = getDaysUntilNextBilling(s.nextBillingDate);
        return d >= 0 && d <= 3 && s.status !== 'canceled';
      });

      if (urgent.length > 0) {
        new Notification('【SubTrack】更新間近のサブスクがあります', {
          body: `${urgent.map((u) => u.name).join('、')} の請求・更新が間近です。確認してください。`,
        });
      }
    }
  }, []);

  // 変更時にlocalStorage自動保存
  const updateSubscriptions = (newSubs: Subscription[]) => {
    setSubscriptions(newSubs);
    saveSubscriptions(newSubs);
  };

  // 1件追加または更新
  const handleSaveSubscription = (sub: Subscription) => {
    const exists = subscriptions.some((s) => s.id === sub.id);
    let updated: Subscription[];
    if (exists) {
      updated = subscriptions.map((s) => (s.id === sub.id ? sub : s));
    } else {
      updated = [sub, ...subscriptions];
    }
    updateSubscriptions(updated);
  };

  // 1件更新
  const handleUpdateSingle = (sub: Subscription) => {
    const updated = subscriptions.map((s) => (s.id === sub.id ? sub : s));
    updateSubscriptions(updated);
  };

  // 1件削除
  const handleDeleteSubscription = (id: string) => {
    const target = subscriptions.find((s) => s.id === id);
    if (!target) return;
    if (confirm(`「${target.name}」を削除してもよろしいですか？`)) {
      const updated = subscriptions.filter((s) => s.id !== id);
      updateSubscriptions(updated);
    }
  };

  // マネフォCSVからの一括追加
  const handleImportMoneyForward = (newSubs: Subscription[]) => {
    const updated = [...newSubs, ...subscriptions];
    updateSubscriptions(updated);
  };

  // バックアップ復元
  const handleRestore = (restored: Subscription[]) => {
    updateSubscriptions(restored);
  };

  // 編集モーダルを開く
  const handleOpenEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setIsAddEditOpen(true);
  };

  // 新規追加モーダルを開く
  const handleOpenAdd = () => {
    setEditingSub(null);
    setIsAddEditOpen(true);
  };

  // 無駄サブスク（断捨離推奨）件数
  const wasteCount = subscriptions.filter(
    (s) => s.status !== 'canceled' && assessWasteRisk(s).isWaste
  ).length;

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ナビゲーションバー */}
      <Header
        onOpenAddModal={handleOpenAdd}
        onOpenMfModal={() => setIsMfOpen(true)}
        onOpenWasteModal={() => setIsWasteOpen(true)}
        onOpenCalendarModal={() => setIsCalendarOpen(true)}
        onOpenBackupModal={() => setIsBackupOpen(true)}
        wasteCount={wasteCount}
      />

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* ダッシュボード */}
        <Dashboard
          subscriptions={subscriptions}
          onOpenWasteModal={() => setIsWasteOpen(true)}
          onSelectSubscription={handleOpenEdit}
        />

        {/* サブスク一覧セクション */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              契約サブスク一覧
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              合計 {subscriptions.length} 件登録
            </span>
          </div>

          <SubscriptionList
            subscriptions={subscriptions}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteSubscription}
            onUpdate={handleUpdateSingle}
            onAddNew={handleOpenAdd}
          />
        </section>
      </main>

      {/* フッター */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">SubTrack</span>
            <span>—</span>
            <span>マネーフォワード ME 連携 &amp; サブスク断捨離ツール</span>
          </div>
          <div>すべてのデータはブラウザ（localStorage）に安全に保存されます</div>
        </div>
      </footer>

      {/* モーダル群 */}
      <SubscriptionModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSaveSubscription}
        subscriptionToEdit={editingSub}
      />

      <MoneyForwardModal
        isOpen={isMfOpen}
        onClose={() => setIsMfOpen(false)}
        onImport={handleImportMoneyForward}
        existingNames={subscriptions.map((s) => s.name)}
      />

      <WasteCleanerModal
        isOpen={isWasteOpen}
        onClose={() => setIsWasteOpen(false)}
        subscriptions={subscriptions}
        onUpdateSubscription={handleUpdateSingle}
      />

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        subscriptions={subscriptions}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        subscriptions={subscriptions}
        onRestore={handleRestore}
      />
    </div>
  );
};

export default App;
