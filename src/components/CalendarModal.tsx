import React, { useState } from 'react';
import type { Subscription } from '../types/subscription';
import {
  downloadIcsFile,
  requestNotificationPermission,
} from '../utils/calendar';
import {
  X,
  Calendar,
  Download,
  Bell,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  subscriptions,
}) => {
  const [hasNotifPermission, setHasNotifPermission] = useState<boolean>(
    'Notification' in window && Notification.permission === 'granted'
  );

  if (!isOpen) return null;

  const handleRequestNotif = async () => {
    const granted = await requestNotificationPermission();
    setHasNotifPermission(granted);
    if (granted) {
      new Notification('SubTrack 通知有効化', {
        body: 'サブスクの更新日前に通知を受け取れるようになりました。',
      });
    }
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(subscriptions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                更新日リマインダー &amp; カレンダー連携
              </h3>
              <p className="text-xs text-slate-500">
                スマホやPCのカレンダーに更新日を登録し、解約忘れを防止
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
          {/* iCalダウンロード */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-slate-700" />
                <span className="text-sm font-bold text-slate-900">
                  カレンダーファイル (.ics) 一括エクスポート
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              登録中のサブスクの次回更新日・金額・解約リンクを含んだカレンダーファイルを書き出します。iPhoneのカレンダー、Googleカレンダー、Outlookにまとめてインポートできます。各予定の3日前に通知アラームが設定されます。
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>.ics ファイルをダウンロード ({subscriptions.length}件)</span>
              </button>
            </div>
          </div>

          {/* Google カレンダー */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-bold text-slate-900">Google カレンダー個別追加</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              各サブスクカードの右下にある「カレンダー追加アイコン（<Calendar className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" />）」をクリックすると、ワンタップでGoogleカレンダーにリマインダーを登録できます。
            </p>
          </div>

          {/* ブラウザ通知 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-bold text-slate-900">ブラウザ通知</span>
              </div>
              {hasNotifPermission ? (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  有効化済み
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestNotif}
                  className="px-3 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs"
                >
                  通知を許可する
                </button>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ブラウザ通知を許可すると、アプリを開いた際に更新間近のサブスクがある場合にデスクトップ通知を表示します。
            </p>
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
