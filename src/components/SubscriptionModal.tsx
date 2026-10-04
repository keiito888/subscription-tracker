import React, { useState, useEffect } from 'react';
import type {
  Subscription,
  Category,
  BillingCycle,
  SubscriptionStatus,
  UsageFrequency,
  SatisfactionLevel,
  Currency,
} from '../types/subscription';
import { CATEGORIES, CYCLE_LABELS, STATUS_LABELS, FREQUENCY_LABELS, KNOWN_SERVICES } from '../utils/constants';
import type { KnownServicePreset } from '../utils/constants';
import { X, Sparkles, Star } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sub: Subscription) => void;
  subscriptionToEdit?: Subscription | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subscriptionToEdit,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>(1000);
  const [currency, setCurrency] = useState<Currency>('JPY');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [category, setCategory] = useState<Category>('video');
  const [status, setStatus] = useState<SubscriptionStatus>('active');
  const [nextBillingDate, setNextBillingDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cancelUrl, setCancelUrl] = useState('');
  const [cancelProcedureNote, setCancelProcedureNote] = useState('');
  const [usageFrequency, setUsageFrequency] = useState<UsageFrequency>('weekly');
  const [satisfaction, setSatisfaction] = useState<SatisfactionLevel>(4);
  const [memo, setMemo] = useState('');
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(3);

  // 入力サジェスト候補
  const [suggestions, setSuggestions] = useState<KnownServicePreset[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (subscriptionToEdit) {
      setName(subscriptionToEdit.name);
      setPrice(subscriptionToEdit.price);
      setCurrency(subscriptionToEdit.currency);
      setCycle(subscriptionToEdit.cycle);
      setCategory(subscriptionToEdit.category);
      setStatus(subscriptionToEdit.status);
      setNextBillingDate(subscriptionToEdit.nextBillingDate);
      setPaymentMethod(subscriptionToEdit.paymentMethod || '');
      setCancelUrl(subscriptionToEdit.cancelUrl || '');
      setCancelProcedureNote(subscriptionToEdit.cancelProcedureNote || '');
      setUsageFrequency(subscriptionToEdit.usageFrequency);
      setSatisfaction(subscriptionToEdit.satisfaction);
      setMemo(subscriptionToEdit.memo || '');
      setNotifyDaysBefore(subscriptionToEdit.notifyDaysBefore || 3);
    } else {
      // 新規デフォルト
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const defaultDate = nextMonth.toISOString().split('T')[0];

      setName('');
      setPrice(1000);
      setCurrency('JPY');
      setCycle('monthly');
      setCategory('video');
      setStatus('active');
      setNextBillingDate(defaultDate);
      setPaymentMethod('クレジットカード');
      setCancelUrl('');
      setCancelProcedureNote('');
      setUsageFrequency('weekly');
      setSatisfaction(4);
      setMemo('');
      setNotifyDaysBefore(3);
    }
  }, [subscriptionToEdit, isOpen]);

  if (!isOpen) return null;

  // サービス名入力時のオートサジェスト
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);

    if (val.trim().length >= 1) {
      const filtered = KNOWN_SERVICES.filter(
        (p) =>
          p.name.toLowerCase().includes(val.toLowerCase()) ||
          p.keywords.some((kw) => kw.toLowerCase().includes(val.toLowerCase()))
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // サジェスト選択時の一括自動補完
  const handleSelectPreset = (preset: KnownServicePreset) => {
    setName(preset.name);
    setCategory(preset.category);
    if (preset.defaultPrice) setPrice(preset.defaultPrice);
    if (preset.defaultCycle) setCycle(preset.defaultCycle);
    if (preset.cancelUrl) setCancelUrl(preset.cancelUrl);
    if (preset.cancelNote) setCancelProcedureNote(preset.cancelNote);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const subData: Subscription = {
      id: subscriptionToEdit ? subscriptionToEdit.id : `sub-${Date.now()}`,
      name: name.trim(),
      price: typeof price === 'number' ? price : 0,
      currency,
      cycle,
      category,
      status,
      nextBillingDate: nextBillingDate || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod.trim() || '未指定',
      cancelUrl: cancelUrl.trim() || undefined,
      cancelProcedureNote: cancelProcedureNote.trim() || undefined,
      usageFrequency,
      satisfaction,
      memo: memo.trim() || undefined,
      notifyDaysBefore,
      createdAt: subscriptionToEdit ? subscriptionToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(subData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {subscriptionToEdit ? 'サブスクの編集' : '新しいサブスクを追加'}
            </h3>
            <p className="text-xs text-slate-500">
              サービス名を入力すると、解約リンクや料金が自動補完されます
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* サービス名 (サジェスト付き) */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              サービス名 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例: Netflix, Spotify, ChatGPT Plus..."
              value={name}
              onChange={handleNameChange}
              onFocus={() => name.length >= 1 && setShowSuggestions(true)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />

            {/* サジェストドロップダウン */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>自動補完プリセット (選択すると設定を自動反映)</span>
                </div>
                {suggestions.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-emerald-50/50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{p.name}</span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        {CATEGORIES[p.category]?.name}
                      </span>
                    </div>
                    {p.defaultPrice && (
                      <span className="text-xs font-semibold text-emerald-700">
                        ¥{p.defaultPrice.toLocaleString()} / {CYCLE_LABELS[p.defaultCycle || 'monthly'].short}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 金額・通貨・周期 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                金額 <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">通貨</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="JPY">JPY (円)</option>
                <option value="USD">USD (米ドル)</option>
                <option value="EUR">EUR (ユーロ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">請求周期</label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value as BillingCycle)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {Object.entries(CYCLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* カテゴリ & ステータス */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">カテゴリ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {Object.values(CATEGORIES).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ステータス</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 次回請求日 & 決済方法 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">次回請求日 (更新日)</label>
              <input
                type="date"
                required
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">決済方法</label>
              <input
                type="text"
                placeholder="例: 楽天カード, 三井住友カード, PayPay..."
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* 満足度 & 利用頻度 (断捨離診断の最重要指標) */}
          <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>満足度 &amp; 利用頻度 (無駄サブスク断捨離判定用)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 星評価 */}
              <div>
                <span className="block text-xs text-slate-600 mb-1">現在の満足度</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSatisfaction(star as SatisfactionLevel)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= satisfaction
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-700">★{satisfaction}</span>
                </div>
              </div>

              {/* 利用頻度 */}
              <div>
                <span className="block text-xs text-slate-600 mb-1">利用頻度</span>
                <select
                  value={usageFrequency}
                  onChange={(e) => setUsageFrequency(e.target.value as UsageFrequency)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none"
                >
                  {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 解約URL & 手順メモ */}
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                解約ページURL (次回請求前の解約直通リンク)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={cancelUrl}
                onChange={(e) => setCancelUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                解約手順・注意点メモ
              </label>
              <input
                type="text"
                placeholder="例: アプリ内ではなくWebブラウザから解約が必要、毎月10日締切など"
                value={cancelProcedureNote}
                onChange={(e) => setCancelProcedureNote(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">メモ</label>
            <textarea
              rows={2}
              placeholder="契約プラン名や解約検討理由など..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* フッターボタン */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-200 transition-all hover:scale-105"
            >
              {subscriptionToEdit ? '変更を保存' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
