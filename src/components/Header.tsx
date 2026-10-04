import React from 'react';
import { Plus, FileSpreadsheet, Sparkles, Calendar, Download } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenMfModal: () => void;
  onOpenWasteModal: () => void;
  onOpenCalendarModal: () => void;
  onOpenBackupModal: () => void;
  wasteCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenMfModal,
  onOpenWasteModal,
  onOpenCalendarModal,
  onOpenBackupModal,
  wasteCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-200 text-white font-bold text-xl">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-600">
                  SubTrack
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  家計簿連携
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                サブスク一元管理 &amp; 自動検知断捨離ツール
              </p>
            </div>
          </div>

          {/* アクションボタン群 */}
          <div className="flex items-center gap-2">
            {/* 無駄検知・断捨離ボタン */}
            <button
              onClick={onOpenWasteModal}
              className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                wasteCount > 0
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="無駄サブスクの診断と断捨離シミュレーション"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">断捨離診断</span>
              {wasteCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {wasteCount}
                </span>
              )}
            </button>

            {/* マネーフォワード連携ボタン */}
            <button
              onClick={onOpenMfModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors"
              title="マネーフォワード ME の明細CSVからサブスクを自動検知"
            >
              <FileSpreadsheet className="w-4 h-4 text-orange-600" />
              <span className="hidden sm:inline">マネフォ連携</span>
              <span className="sm:hidden">MF連携</span>
            </button>

            {/* カレンダー連携ボタン */}
            <button
              onClick={onOpenCalendarModal}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="更新通知・カレンダー連携 (.ics / Googleカレンダー)"
            >
              <Calendar className="w-5 h-5" />
            </button>

            {/* バックアップ・復元ボタン */}
            <button
              onClick={onOpenBackupModal}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="バックアップ・エクスポート・初期化"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* 新規登録ボタン */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>追加</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
