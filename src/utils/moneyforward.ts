import type { MoneyForwardRecord, DetectedCandidate, Category, BillingCycle } from '../types/subscription';
import { KNOWN_SERVICES } from './constants';

/**
 * ファイルのエンコーディング (UTF-8 または Shift_JIS) を自動判定してテキストに変換
 */
export async function readCsvFileAsText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  
  // まず UTF-8 (厳格モード) で試行
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    return utf8Decoder.decode(buffer);
  } catch {
    // UTF-8 で失敗した場合 Shift_JIS でデコード (マネーフォワード標準)
    try {
      const sjisDecoder = new TextDecoder('shift-jis');
      return sjisDecoder.decode(buffer);
    } catch {
      // フォールバック
      const fallbackDecoder = new TextDecoder('utf-8');
      return fallbackDecoder.decode(buffer);
    }
  }
}

/**
 * CSV文字列を行とカラムに分割 (クォート対応)
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // スキップ
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows;
}

/**
 * マネーフォワード ME のCSVをレコード配列に変換
 */
export function parseMoneyForwardCsv(csvText: string): MoneyForwardRecord[] {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];

  // ヘッダー行探索 (「計算対象」「日付」「内容」を含む行)
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const joined = rows[i].join(',');
    if (joined.includes('日付') && joined.includes('内容') && joined.includes('金額')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0; // 見つからない場合は1行目
  }

  const header = rows[headerIndex].map((h) => h.replace(/["\s]/g, ''));
  const isTargetIdx = header.findIndex((h) => h.includes('計算対象'));
  const dateIdx = header.findIndex((h) => h.includes('日付'));
  const contentIdx = header.findIndex((h) => h.includes('内容'));
  const amountIdx = header.findIndex((h) => h.includes('金額'));
  const institutionIdx = header.findIndex((h) => h.includes('保有金融機関'));
  const majorCatIdx = header.findIndex((h) => h.includes('大項目'));
  const minorCatIdx = header.findIndex((h) => h.includes('中項目'));
  const memoIdx = header.findIndex((h) => h.includes('メモ'));
  const transferIdx = header.findIndex((h) => h.includes('振替'));
  const idIdx = header.findIndex((h) => h.includes('ID') || h.includes('id'));

  const records: MoneyForwardRecord[] = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 3) continue;

    const rawAmountStr = (amountIdx >= 0 ? row[amountIdx] : '').replace(/[,円]/g, '');
    const amountVal = parseFloat(rawAmountStr) || 0;

    const record: MoneyForwardRecord = {
      isTarget: isTargetIdx >= 0 ? row[isTargetIdx] === '1' || row[isTargetIdx] === '対象' : true,
      date: dateIdx >= 0 ? row[dateIdx] : '',
      content: contentIdx >= 0 ? row[contentIdx] : '',
      amount: amountVal,
      institution: institutionIdx >= 0 ? row[institutionIdx] : '',
      majorCategory: majorCatIdx >= 0 ? row[majorCatIdx] : '',
      minorCategory: minorCatIdx >= 0 ? row[minorCatIdx] : '',
      memo: memoIdx >= 0 ? row[memoIdx] : '',
      isTransfer: transferIdx >= 0 ? row[transferIdx] === '1' : false,
      id: idIdx >= 0 ? row[idIdx] : `mf-${i}-${Date.now()}`,
    };

    if (record.date && record.content) {
      records.push(record);
    }
  }

  return records;
}

/**
 * サービス名のクレンジング (カブシキガイシャ、決済プレフィックスなどを正規化)
 */
export function cleanServiceName(rawName: string): string {
  let cleaned = rawName
    .replace(/^カ\)\s*|^（株）\s*|^株式会社\s*/, '')
    .replace(/\s*カ\)$|\s*（株）$|\s*株式会社$/, '')
    .replace(/^(AMAZON\.CO\.JP|AMAZON|アマゾン)\s*/i, 'Amazon ')
    .replace(/^APPLE\s*COM\s*BILL/i, 'Apple Services')
    .replace(/^GOOGLE\s*\*/i, 'Google ')
    .replace(/\s+\d{6,}.*$/, '') // 末尾の注文番号や長い数字を除去
    .trim();

  // 既知のキーワードマッチング
  const lower = cleaned.toLowerCase();
  for (const preset of KNOWN_SERVICES) {
    if (preset.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return preset.name;
    }
  }

  return cleaned;
}

/**
 * マネーフォワードMEのレコード群からサブスク候補を自動検出
 */
export function detectSubscriptionsFromMF(records: MoneyForwardRecord[]): DetectedCandidate[] {
  // 支出レコードのみ抽出 (振替は除外、金額が0以外)
  const expenseRecords = records.filter(
    (r) => !r.isTransfer && r.amount !== 0 && (r.majorCategory !== '収入')
  );

  // サービス名（クレンジング後）ごとにグループ化
  const groups: Record<
    string,
    {
      cleanName: string;
      rawRecords: MoneyForwardRecord[];
      amounts: number[];
      dates: string[];
      institutions: string[];
    }
  > = {};

  for (const r of expenseRecords) {
    // 支出額は正の数で統一
    const absAmount = Math.abs(r.amount);
    const cleanName = cleanServiceName(r.content);
    const groupKey = cleanName.toLowerCase();

    if (!groups[groupKey]) {
      groups[groupKey] = {
        cleanName,
        rawRecords: [],
        amounts: [],
        dates: [],
        institutions: [],
      };
    }

    groups[groupKey].rawRecords.push(r);
    groups[groupKey].amounts.push(absAmount);
    groups[groupKey].dates.push(r.date);
    if (r.institution && !groups[groupKey].institutions.includes(r.institution)) {
      groups[groupKey].institutions.push(r.institution);
    }
  }

  const candidates: DetectedCandidate[] = [];

  for (const [key, group] of Object.entries(groups)) {
    const dates = group.dates.sort().reverse(); // 新しい順
    const mostRecentDate = dates[0];
    
    // 最頻値または最新の金額
    const latestAmount = group.amounts[group.amounts.length - 1];
    
    // 既知サービスかチェック
    const matchedPreset = KNOWN_SERVICES.find((p) =>
      p.keywords.some((kw) => key.includes(kw.toLowerCase()) || group.cleanName.toLowerCase().includes(kw.toLowerCase()))
    );

    let cycle: BillingCycle = matchedPreset?.defaultCycle || 'monthly';
    let similarityScore = 0;
    let suggestedCategory: Category = matchedPreset?.category || 'other';

    // 既知のサブスクなら一発で高スコア
    if (matchedPreset) {
      similarityScore += 70;
    }

    // 出現回数による判定
    if (group.rawRecords.length >= 2) {
      similarityScore += 25;
      
      // 日付間隔を検証
      if (dates.length >= 2) {
        const d1 = new Date(dates[0]).getTime();
        const d2 = new Date(dates[1]).getTime();
        const diffDays = Math.abs(Math.round((d1 - d2) / (1000 * 60 * 60 * 24)));

        if (diffDays >= 25 && diffDays <= 35) {
          cycle = 'monthly';
          similarityScore += 30;
        } else if (diffDays >= 340 && diffDays <= 390) {
          cycle = 'yearly';
          similarityScore += 30;
        }
      }

      // 金額の一致チェック
      const allSameAmount = group.amounts.every((a) => a === latestAmount);
      if (allSameAmount) {
        similarityScore += 20;
      }
    }

    // 大項目・中項目からのカテゴリ推測
    const sampleRecord = group.rawRecords[0];
    if (suggestedCategory === 'other' && sampleRecord) {
      const catText = `${sampleRecord.majorCategory} ${sampleRecord.minorCategory}`;
      if (catText.includes('通信') || catText.includes('インターネット') || catText.includes('携帯')) {
        suggestedCategory = 'communication';
      } else if (catText.includes('エンタメ') || catText.includes('映画') || catText.includes('音楽')) {
        suggestedCategory = 'video';
      } else if (catText.includes('書籍') || catText.includes('新聞')) {
        suggestedCategory = 'reading';
      } else if (catText.includes('健康') || catText.includes('ジム')) {
        suggestedCategory = 'fitness';
      }
    }

    // サブスク候補基準：既知サービス または スコア50以上 または 2回以上かつ同額
    if (matchedPreset || similarityScore >= 45 || (group.rawRecords.length >= 2 && group.amounts[0] === group.amounts[1])) {
      // 次回請求予定日を推定 (最新の日付 + 1ヶ月 or 1年)
      let nextEstimatedDate = '';
      if (mostRecentDate) {
        const [y, m, d] = mostRecentDate.split(/[-/]/).map(Number);
        const next = new Date(y, (m || 1) - 1, d || 1);
        if (cycle === 'monthly') {
          next.setMonth(next.getMonth() + 1);
        } else if (cycle === 'yearly') {
          next.setFullYear(next.getFullYear() + 1);
        }
        
        // もし過去日になっていたら現在以降まで繰り越し
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        while (next < now) {
          if (cycle === 'monthly') {
            next.setMonth(next.getMonth() + 1);
          } else {
            next.setFullYear(next.getFullYear() + 1);
          }
        }

        const ny = next.getFullYear();
        const nm = String(next.getMonth() + 1).padStart(2, '0');
        const nd = String(next.getDate()).padStart(2, '0');
        nextEstimatedDate = `${ny}-${nm}-${nd}`;
      }

      candidates.push({
        id: `candidate-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: group.cleanName,
        cleanName: group.cleanName,
        amount: latestAmount,
        cycle,
        occurrences: group.rawRecords.length,
        dates: group.dates,
        institution: group.institutions.join(', ') || 'クレカ決済',
        suggestedCategory,
        nextEstimatedDate: nextEstimatedDate || new Date().toISOString().split('T')[0],
        similarityScore: Math.min(similarityScore, 100),
      });
    }
  }

  // スコア順、出現回数順にソート
  return candidates.sort((a, b) => b.similarityScore - a.similarityScore || b.occurrences - a.occurrences);
}

/**
 * 動作確認用マネーフォワードMEデモCSVデータ生成
 */
export function getSampleMoneyForwardCsv(): string {
  const today = new Date();
  const getPastDate = (monthsAgo: number, day: number) => {
    const d = new Date(today.getFullYear(), today.getMonth() - monthsAgo, day);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${y}/${m}/${dayStr}`;
  };

  return `"計算対象","日付","内容","金額（円）","保有金融機関","大項目","中項目","メモ","振替","ID"
"1","${getPastDate(0, 15)}","NETFLIX.COM","-1490","楽天カード","エンタメ","映画・動画","スタンダードプラン","0","mf-101"
"1","${getPastDate(1, 15)}","NETFLIX.COM","-1490","楽天カード","エンタメ","映画・動画","スタンダードプラン","0","mf-102"
"1","${getPastDate(2, 15)}","NETFLIX.COM","-1490","楽天カード","エンタメ","映画・動画","スタンダードプラン","0","mf-103"
"1","${getPastDate(0, 5)}","SPOTIFY JAPAN","-980","三井住友カード","エンタメ","音楽","プレミアム個人","0","mf-104"
"1","${getPastDate(1, 5)}","SPOTIFY JAPAN","-980","三井住友カード","エンタメ","音楽","プレミアム個人","0","mf-105"
"1","${getPastDate(2, 5)}","SPOTIFY JAPAN","-980","三井住友カード","エンタメ","音楽","プレミアム個人","0","mf-106"
"1","${getPastDate(0, 20)}","OPENAI *CHATGPT SUBSCRIPTION","-3000","三井住友カード","通信費","その他通信費","Plus会員","0","mf-107"
"1","${getPastDate(1, 20)}","OPENAI *CHATGPT SUBSCRIPTION","-3000","三井住友カード","通信費","その他通信費","Plus会員","0","mf-108"
"1","${getPastDate(0, 28)}","APPLE COM BILL","-1200","楽天カード","通信費","その他通信費","iCloud 2TB","0","mf-109"
"1","${getPastDate(1, 28)}","APPLE COM BILL","-1200","楽天カード","通信費","その他通信費","iCloud 2TB","0","mf-110"
"1","${getPastDate(0, 1)}","チョコザップ 会費","-3278","楽天カード","健康・医療","フィットネス","月会費","0","mf-111"
"1","${getPastDate(1, 1)}","チョコザップ 会費","-3278","楽天カード","健康・医療","フィットネス","月会費","0","mf-112"
"1","${getPastDate(0, 10)}","セブンイレブン 渋谷店","-648","PayPay","食費","食料品","昼食","0","mf-113"
"1","${getPastDate(0, 12)}","スターバックスコーヒー","-590","PayPay","カフェ","カフェ","コーヒー","0","mf-114"
`;
}
