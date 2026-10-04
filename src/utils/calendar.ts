import type { Subscription } from '../types/subscription';
import { formatCurrency } from './calculations';

/**
 * Google カレンダーに追加するためのリンクURLを生成
 */
export function generateGoogleCalendarUrl(sub: Subscription): string {
  const title = encodeURIComponent(`【サブスク更新】${sub.name} (${formatCurrency(sub.price, sub.currency)})`);
  
  // 日付 YYYYMMDD
  const dateFormatted = sub.nextBillingDate.replace(/-/g, '');
  const dates = `${dateFormatted}/${dateFormatted}`;

  const details = encodeURIComponent(
    `サービス名: ${sub.name}\n金額: ${formatCurrency(sub.price, sub.currency)} / 周期: ${sub.cycle}\n決済方法: ${sub.paymentMethod}\n${
      sub.cancelUrl ? `解約リンク: ${sub.cancelUrl}\n` : ''
    }${sub.cancelProcedureNote ? `解約手順・注意点: ${sub.cancelProcedureNote}\n` : ''}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&trp=false`;
}

/**
 * iCalendar (.ics) ファイルのテキスト生成 (iPhone, Mac, Outlook対応)
 */
export function generateIcsContent(subscriptions: Subscription[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SubTrack//Subscription Tracker//JA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const sub of subscriptions) {
    if (sub.status === 'canceled') continue;
    const dateFormatted = sub.nextBillingDate.replace(/-/g, '');
    const uid = `${sub.id}-${dateFormatted}@subtrack.local`;
    const summary = `【サブスク更新】${sub.name} (${formatCurrency(sub.price, sub.currency)})`;
    const description = `サービス: ${sub.name}\\n金額: ${formatCurrency(sub.price, sub.currency)}\\n決済: ${
      sub.paymentMethod
    }${sub.cancelUrl ? `\\n解約URL: ${sub.cancelUrl}` : ''}`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${dateFormatted}`,
      `DTEND;VALUE=DATE:${dateFormatted}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P3D', // 3日前にアラーム
      'ACTION:DISPLAY',
      `DESCRIPTION:サブスク更新通知: ${sub.name}`,
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * .ics ファイルをダウンロード
 */
export function downloadIcsFile(subscriptions: Subscription[], filename = 'subscriptions.ics'): void {
  const content = generateIcsContent(subscriptions);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * ブラウザ通知リクエスト
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  const result = await Notification.requestPermission();
  return result === 'granted';
}
