import React, { useRef } from 'react';
import type { Subscription } from '../types/subscription';
import {
  exportSubscriptionsAsJson,
  exportSubscriptionsAsCsv,
  getInitialSampleData,
} from '../utils/storage';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  Trash2,
  Database,
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  onRestore: (subs: Subscription[]) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  subscriptions,
  onRestore,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onRestore(parsed);
          alert('データの復元が完了しました！');
          onClose();
        } else {
          alert('無効なデータ形式です。');
        }
      } catch (err) {
        console.error(err);
        alert('ファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSample = () => {
    if (confirm('現在のデータをサンプルデータで上書きしますか？')) {
      onRestore(getInitialSampleData());
      onClose();
    }
  };

  const handleClearAll = () => {
    if (confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。')) {
      onRestore([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">データ管理 &amp; バックアップ</h3>
              <p className="text-xs text-slate-500">
                データの書き出し、バックアップの復元、サンプル初期化
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

        <div className="mt-4 space-y-4">
          {/* エクスポート */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-700">データのエクスポート</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => exportSubscriptionsAsJson(subscriptions)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>JSONバックアップ保存</span>
              </button>

              <button
                type="button"
                onClick={() => exportSubscriptionsAsCsv(subscriptions)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>CSVエクスポート (Excel)</span>
              </button>
            </div>
          </div>

          {/* インポート */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-700">バックアップの復元</span>
            <p className="text-xs text-slate-500">
              保存したJSONファイルを選択して登録データを復元します。
            </p>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleJsonUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>JSONファイルから復元</span>
              </button>
            </div>
          </div>

          {/* 初期化 / サンプルリセット */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-700">サンプルデータ・全消去</span>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetSample}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>サンプルデータを再読み込み</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>全データを初期化 (クリア)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 mt-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
