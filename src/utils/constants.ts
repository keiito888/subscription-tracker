import type { Category, CategoryInfo, BillingCycle, SubscriptionStatus, UsageFrequency } from '../types/subscription';

export const CATEGORIES: Record<Category, CategoryInfo> = {
  video: {
    id: 'video',
    name: '動画・配信',
    color: '#ef4444',
    bgColor: 'bg-red-50 dark:bg-red-950/40',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  music: {
    id: 'music',
    name: '音楽・ポッドキャスト',
    color: '#10b981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  software: {
    id: 'software',
    name: 'ソフトウェア・AI・クラウド',
    color: '#3b82f6',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  reading: {
    id: 'reading',
    name: '書籍・雑誌・ニュース',
    color: '#f59e0b',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  lifestyle: {
    id: 'lifestyle',
    name: '生活・配送・飲食',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    textColor: 'text-purple-700 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  fitness: {
    id: 'fitness',
    name: '健康・フィットネス・ジム',
    color: '#06b6d4',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
    textColor: 'text-cyan-700 dark:text-cyan-400',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
  },
  gaming: {
    id: 'gaming',
    name: 'ゲーム',
    color: '#ec4899',
    bgColor: 'bg-pink-50 dark:bg-pink-950/40',
    textColor: 'text-pink-700 dark:text-pink-400',
    borderColor: 'border-pink-200 dark:border-pink-800',
  },
  communication: {
    id: 'communication',
    name: '通信・ネット回線・SIM',
    color: '#14b8a6',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    textColor: 'text-teal-700 dark:text-teal-400',
    borderColor: 'border-teal-200 dark:border-teal-800',
  },
  other: {
    id: 'other',
    name: 'その他',
    color: '#64748b',
    bgColor: 'bg-slate-50 dark:bg-slate-900',
    textColor: 'text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-200 dark:border-slate-800',
  },
};

export const CYCLE_LABELS: Record<BillingCycle, { label: string; short: string; monthsFactor: number }> = {
  monthly: { label: '月払い (月額)', short: '月', monthsFactor: 1 },
  yearly: { label: '年払い (年額)', short: '年', monthsFactor: 12 },
  quarterly: { label: '3ヶ月ごと (四半期)', short: '3ヶ月', monthsFactor: 3 },
  weekly: { label: '週払い (週額)', short: '週', monthsFactor: 0.23 },
};

export const STATUS_LABELS: Record<SubscriptionStatus, { label: string; color: string; badgeClass: string }> = {
  active: { label: '契約中', color: '#10b981', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  trial: { label: '無料体験中', color: '#f59e0b', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse' },
  canceling: { label: '解約予定', color: '#ef4444', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' },
  paused: { label: '一時停止', color: '#6b7280', badgeClass: 'bg-gray-100 text-gray-800 border-gray-300' },
  canceled: { label: '解約済', color: '#9ca3af', badgeClass: 'bg-slate-100 text-slate-500 border-slate-200 line-through' },
};

export const FREQUENCY_LABELS: Record<UsageFrequency, { label: string; score: number }> = {
  daily: { label: 'ほぼ毎日', score: 4 },
  weekly: { label: '週に数回', score: 3 },
  monthly: { label: '月に数回', score: 2 },
  rare: { label: 'ほとんど使っていない', score: 1 },
};

// 代表的なサービスの既知データベース（自動補完用）
export interface KnownServicePreset {
  keywords: string[];
  name: string;
  category: Category;
  defaultPrice?: number;
  defaultCycle?: BillingCycle;
  cancelUrl?: string;
  cancelNote?: string;
}

export const KNOWN_SERVICES: KnownServicePreset[] = [
  {
    keywords: ['netflix', 'ネットフリックス'],
    name: 'Netflix',
    category: 'video',
    defaultPrice: 1490,
    defaultCycle: 'monthly',
    cancelUrl: 'https://www.netflix.com/youraccount',
    cancelNote: 'Webブラウザのアカウント設定から解約手続き可能。次回請求日前まで視聴継続可。',
  },
  {
    keywords: ['spotify', 'スポティファイ'],
    name: 'Spotify Premium',
    category: 'music',
    defaultPrice: 980,
    defaultCycle: 'monthly',
    cancelUrl: 'https://www.spotify.com/account/overview/',
    cancelNote: 'アプリ内では解約不可。Web版Spotifyのアカウントページ「プランを変更」からFreeに切替。',
  },
  {
    keywords: ['amazon prime', 'アマゾンプライム', 'amazonプライム', 'アマゾン プライム'],
    name: 'Amazon Prime',
    category: 'lifestyle',
    defaultPrice: 600,
    defaultCycle: 'monthly',
    cancelUrl: 'https://www.amazon.co.jp/mc/manage',
    cancelNote: '「プライム会員情報」→「会員資格を終了する」より手続き。',
  },
  {
    keywords: ['youtube premium', 'youtube music', 'ユーチューブ'],
    name: 'YouTube Premium',
    category: 'video',
    defaultPrice: 1280,
    defaultCycle: 'monthly',
    cancelUrl: 'https://www.youtube.com/paid_memberships',
    cancelNote: 'Apple経由契約の場合はiOSの「サブスクリプション」から解約が必要。',
  },
  {
    keywords: ['apple.com/bill', 'apple combill', 'icloud', 'apple one', 'itunes'],
    name: 'Apple Services (iCloud / Apple One)',
    category: 'software',
    defaultPrice: 1200,
    defaultCycle: 'monthly',
    cancelUrl: 'https://support.apple.com/ja-jp/HT202039',
    cancelNote: 'iPhone設定アプリ → 一番上の名前 → 「サブスクリプション」から解約。',
  },
  {
    keywords: ['chatgpt', 'openai'],
    name: 'ChatGPT Plus',
    category: 'software',
    defaultPrice: 3000,
    defaultCycle: 'monthly',
    cancelUrl: 'https://chatgpt.com/#settings',
    cancelNote: '画面左下プロフィール → 「設定」→「サブスクリプションの管理」から解約。',
  },
  {
    keywords: ['adobe', 'アドビ'],
    name: 'Adobe Creative Cloud',
    category: 'software',
    defaultPrice: 6578,
    defaultCycle: 'monthly',
    cancelUrl: 'https://account.adobe.com/plans',
    cancelNote: '年間プラン月々払いは途中解約時に残額の50%の早期解約手数料が発生する場合あり要注意！',
  },
  {
    keywords: ['github', 'ギットハブ'],
    name: 'GitHub Copilot / Pro',
    category: 'software',
    defaultPrice: 1500,
    defaultCycle: 'monthly',
    cancelUrl: 'https://github.com/settings/billing',
    cancelNote: 'GitHub設定 → Billing and plans → Plans and usage からダウングレード。',
  },
  {
    keywords: ['notion', 'ノーション'],
    name: 'Notion Plus',
    category: 'software',
    defaultPrice: 1500,
    defaultCycle: 'monthly',
    cancelUrl: 'https://www.notion.so/settings',
    cancelNote: '設定とメンバー → 請求 → プランを変更からFreeプランに変更。',
  },
  {
    keywords: ['disney', 'ディズニープラス'],
    name: 'Disney+',
    category: 'video',
    defaultPrice: 990,
    defaultCycle: 'monthly',
    cancelUrl: 'https://www.disneyplus.com/account',
    cancelNote: 'dアカウント経由で契約した場合はMy docomo側での解約が必要。',
  },
  {
    keywords: ['dazn', 'ダゾーン'],
    name: 'DAZN',
    category: 'video',
    defaultPrice: 4200,
    defaultCycle: 'monthly',
    cancelUrl: 'https://www.dazn.com/ja-JP/account/subscription',
    cancelNote: '年間プランの場合は契約期間満了まで解約不可の規約に注意。',
  },
  {
    keywords: ['nintendo', '任天堂', 'switch online'],
    name: 'Nintendo Switch Online',
    category: 'gaming',
    defaultPrice: 2400,
    defaultCycle: 'yearly',
    cancelUrl: 'https://store-jp.nintendo.com/',
    cancelNote: 'ニンテンドーeショップの「アカウント情報」→「ご利用状況」→「自動継続購入の更新停止」。',
  },
  {
    keywords: ['u-next', 'ユーネクスト'],
    name: 'U-NEXT',
    category: 'video',
    defaultPrice: 2189,
    defaultCycle: 'monthly',
    cancelUrl: 'https://account.unext.jp/account/contract',
    cancelNote: '親アカウントでログインし設定・サポート → 契約内容の確認・解約から。',
  },
  {
    keywords: ['povo', 'ahamo', 'linemo', 'rakuten mobile', '楽天モバイル', 'uq mobile', 'ymobile'],
    name: '携帯格安SIM・通信回線',
    category: 'communication',
    defaultPrice: 2970,
    defaultCycle: 'monthly',
    cancelNote: 'MNP予約番号発行またはマイページより解約手続き。',
  },
  {
    keywords: ['chocozap', 'チョコザップ', 'anytime', 'エニタイム'],
    name: 'ジム・フィットネス',
    category: 'fitness',
    defaultPrice: 3278,
    defaultCycle: 'monthly',
    cancelNote: '解約締日（毎月10日など）を過ぎると翌月末解約になる規約に注意。',
  },
  {
    keywords: ['kindle unlimited', 'キンドル'],
    name: 'Kindle Unlimited',
    category: 'reading',
    defaultPrice: 980,
    defaultCycle: 'monthly',
    cancelUrl: 'https://www.amazon.co.jp/kindle-dbs/ku/ku-central',
    cancelNote: '「Kindle Unlimited 会員登録を管理」→「登録をキャンセル」を選択。',
  }
];
