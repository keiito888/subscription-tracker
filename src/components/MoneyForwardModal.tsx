import React, { useState } from 'react';
import type { Subscription, DetectedCandidate } from '../types/subscription';
import {
  readCsvFileAsText,
  parseMoneyForwardCsv,
  detectSubscriptionsFromMF,
  getSampleMoneyForwardCsv,
} from '../utils/moneyforward';
import { KNOWN_SERVICES, CYCLE_LABELS } from '../utils/constants';
import { formatCurrency } from '../utils/calculations';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface MoneyForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newSubs: Subscription[]) => void;
  existingNames: string[];
}

export const MoneyForwardModal: React.FC<MoneyForwardModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingNames,
}) => {
  const [candidates, setCandidates] = useState<DetectedCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [totalRecordsParsed, setTotalRecordsParsed] = useState(0);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // CSVテキストをパースして候補検出
  const processCsvText = (csvText: string, name: string) => {
    try {
      setIsProcessing(true);
      setErrorMsg('');
      const records = parseMoneyForwardCsv(csvText);
      setTotalRecordsParsed(records.length);
      setFileName(name);

      if (records.length === 0) {
        setErrorMsg('有効な明細データが見つかりませんでした。マネーフォワードMEの「収入・支出詳細」CSVかご確認ください。');
        setCandidates([]);
        setSelectedIds(new Set());
        return;
      }

      const detected = detectSubscriptionsFromMF(records);
      setCandidates(detected);

      // 既存登録されていないものをデフォルト選択
      const initialSelected = new Set<string>();
      detected.forEach((c) => {
        const isAlreadyAdded = existingNames.some(
          (n) => n.toLowerCase() === c.name.toLowerCase()
        );
        if (!isAlreadyAdded) {
          initialSelected.add(c.id);
        }
      });
      setSelectedIds(initialSelected);
    } catch (e) {
      console.error(e);
      setErrorMsg('CSVの解析中にエラーが発生しました。ファイル形式をご確認ください。');
    } finally {
      setIsProcessing(false);
    }
  };

  // ファイル選択ハンドラ
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await readCsvFileAsText(file);
      processCsvText(text, file.name);
    } catch (err) {
      console.error(err);
      setErrorMsg('ファイルの読み込みに失敗しました。');
    }
  };

  // デモ用サンプルCSV読み込み
  const handleLoadSample = () => {
    const sampleCsv = getSampleMoneyForwardCsv();
    processCsvText(sampleCsv, 'moneyforward_sample.csv (デモデータ)');
  };

  // 選択トグル
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // 全選択・全解除
  const handleToggleAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map((c) => c.id)));
    }
  };

  // 一括インポート実行
  const handleConfirmImport = () => {
    const toImport: Subscription[] = candidates
      .filter((c) => selectedIds.has(c.id))
      .map((c) => {
        // 既知プリセットから解約URL等を補完
        const preset = KNOWN_SERVICES.find(
          (p) =>
            p.name.toLowerCase() === c.name.toLowerCase() ||
            p.keywords.some((kw) => c.name.toLowerCase().includes(kw.toLowerCase()))
        );

        return {
          id: `sub-mf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: c.name,
          price: c.amount,
          currency: 'JPY',
          cycle: c.cycle,
          category: c.suggestedCategory,
          status: 'active',
          nextBillingDate: c.nextEstimatedDate,
          paymentMethod: c.institution || 'マネフォ連携',
          cancelUrl: preset?.cancelUrl,
          cancelProcedureNote: preset?.cancelNote,
          usageFrequency: 'weekly',
          satisfaction: 4,
          memo: `マネーフォワードMEの明細から自動検出 (${c.occurrences}回引き落とし確認)`,
          notifyDaysBefore: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

    onImport(toImport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                マネーフォワード ME 家計簿CSV連携
              </h3>
              <p className="text-xs text-slate-500">
                明細から毎月の固定引き落とし・定期課金を自動検知して取り込みます
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

        {/* 説明 & アップロードエリア */}
        <div className="mt-4 space-y-4">
          <div className="p-3.5 bg-orange-50/60 border border-orange-200 rounded-2xl text-xs text-orange-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-orange-600" />
              <span>マネーフォワード ME からのCSV出力方法</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              マネーフォワード ME（Web版）にログイン →「家計」→「家計簿」→「収入・支出詳細」右上の「CSVダウンロード」より取得できます（Shift_JIS / UTF-8 両対応）。
            </p>
          </div>

          {/* ドロップ & 選択ゾーン */}
          <div className="border-2 border-dashed border-slate-200 hover:border-orange-400 rounded-2xl p-6 text-center transition-all bg-slate-50/50 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">
              マネーフォワード ME のCSVファイルをここに選択
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              ファイルはすべてブラウザ内（ローカル）でのみ解析され、外部サーバーへ送信されることは一切ありません。
            </p>

            <div className="flex items-center gap-3 mt-2">
              <label className="cursor-pointer px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors">
                ファイルを選択
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleLoadSample}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>サンプルCSVで試す</span>
              </button>
            </div>

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-orange-600 font-bold mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>明細CSVを解析中...</span>
              </div>
            )}

            {fileName && !isProcessing && (
              <span className="text-xs text-emerald-700 font-medium mt-1">
                読み込み完了: {fileName} ({totalRecordsParsed}行の明細)
              </span>
            )}
          </div>

          {/* エラーメッセージ */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 検出結果リスト */}
          {candidates.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    検出されたサブスク候補 ({candidates.length}件)
                  </h4>
                  <span className="text-xs text-slate-500">
                    (選択中: {selectedIds.size}件)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                >
                  {selectedIds.size === candidates.length ? '全選択を解除' : 'すべて選択'}
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {candidates.map((cand) => {
                  const isChecked = selectedIds.has(cand.id);
                  const isAlreadyAdded = existingNames.some(
                    (n) => n.toLowerCase() === cand.name.toLowerCase()
                  );

                  return (
                    <div
                      key={cand.id}
                      onClick={() => handleToggleSelect(cand.id)}
                      className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                        isChecked ? 'bg-orange-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // 親divのクリックで処理
                        className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {cand.name}
                          </span>
                          {isAlreadyAdded && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                              登録済
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                            信頼度 {cand.similarityScore}%
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span>{cand.institution}</span>
                          <span>•</span>
                          <span>{cand.occurrences}回引き落とし</span>
                          <span>•</span>
                          <span>次回推定: {cand.nextEstimatedDate}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900">
                          {formatCurrency(cand.amount)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {CYCLE_LABELS[cand.cycle]?.short || '月'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* フッターアクション */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              ※ 取り込み後も自由に編集・削除できます
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl shadow-sm shadow-orange-200 transition-all flex items-center gap-1.5"
              >
                <span>選択した {selectedIds.size} 件を一括追加</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
