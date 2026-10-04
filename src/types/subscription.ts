export type BillingCycle = 'monthly' | 'yearly' | 'quarterly' | 'weekly';

export type Category =
  | 'video'
  | 'music'
  | 'software'
  | 'reading'
  | 'lifestyle'
  | 'fitness'
  | 'gaming'
  | 'communication'
  | 'other';

export type SubscriptionStatus = 'active' | 'trial' | 'canceling' | 'paused' | 'canceled';

export type UsageFrequency = 'daily' | 'weekly' | 'monthly' | 'rare';

export type SatisfactionLevel = 1 | 2 | 3 | 4 | 5;

export type Currency = 'JPY' | 'USD' | 'EUR';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  cycle: BillingCycle;
  category: Category;
  status: SubscriptionStatus;
  firstBillingDate?: string; // YYYY-MM-DD
  nextBillingDate: string;  // YYYY-MM-DD
  paymentMethod: string;
  cancelUrl?: string;
  cancelProcedureNote?: string;
  usageFrequency: UsageFrequency;
  satisfaction: SatisfactionLevel;
  memo?: string;
  notifyDaysBefore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInfo {
  id: Category;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export interface MoneyForwardRecord {
  isTarget: boolean; // 計算対象 (1 or 0)
  date: string;      // 日付
  content: string;   // 内容
  amount: number;    // 金額（円）
  institution: string; // 保有金融機関
  majorCategory: string; // 大項目
  minorCategory: string; // 中項目
  memo: string;      // メモ
  isTransfer: boolean; // 振替 (1 or 0)
  id: string;        // ID
}

export interface DetectedCandidate {
  id: string;
  name: string;
  cleanName: string;
  amount: number;
  cycle: BillingCycle;
  occurrences: number;
  dates: string[];
  institution: string;
  suggestedCategory: Category;
  nextEstimatedDate: string;
  similarityScore: number;
}
