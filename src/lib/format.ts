import { format, formatDistanceToNowStrict } from 'date-fns';
import { enIN } from 'date-fns/locale/en-IN';
import { hi } from 'date-fns/locale/hi';

import i18n from '@/i18n';

function dateTimeLocale() {
  return i18n.language;
}

function dateFnsLocale() {
  return i18n.language?.startsWith('hi') ? hi : enIN;
}

export function toDate(value: string | Date): Date {
  return typeof value === 'string' ? new Date(value) : value;
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return i18n.t('format.notSet');
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return i18n.t('format.notSet');
  return new Intl.DateTimeFormat(dateTimeLocale(), {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDateTimeWithWeekday(value: string | Date) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return i18n.t('format.notSet');
  return new Intl.DateTimeFormat(dateTimeLocale(), {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    weekday: 'short',
  }).format(date);
}

export function formatDate(value?: string | Date | null) {
  if (!value) return i18n.t('format.notSet');
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return i18n.t('format.notSet');
  return new Intl.DateTimeFormat(dateTimeLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateWithWeekday(value: string | Date) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return i18n.t('format.notSet');
  return new Intl.DateTimeFormat(dateTimeLocale(), {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTime(value: string | Date) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return i18n.t('format.notSet');
  return new Intl.DateTimeFormat(dateTimeLocale(), {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatHourLabel(hour: number) {
  const slot = new Date();
  slot.setHours(hour, 0, 0, 0);
  return new Intl.DateTimeFormat(dateTimeLocale(), { hour: 'numeric', minute: '2-digit' }).format(slot);
}

export function formatWeekdayShort(value: string | Date) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return i18n.t('format.notSet');
  return new Intl.DateTimeFormat(dateTimeLocale(), { weekday: 'short' }).format(date);
}

export function formatDayOfMonth(value: string | Date) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return i18n.t('format.notSet');
  return new Intl.DateTimeFormat(dateTimeLocale(), { day: 'numeric' }).format(date);
}

export type AssigneeLike = {
  category?: string | null;
  full_name: string;
  kind: 'profile' | 'service_provider';
  role: string;
};

export function formatAssigneeRole(profile: AssigneeLike) {
  return profile.kind === 'service_provider' ? titleize(profile.category) : titleize(profile.role);
}

export function formatAssigneeLabel(profile: AssigneeLike) {
  return `${profile.full_name} (${formatAssigneeRole(profile)})`;
}

/** Dues `period` is stored as the 1st of the month (e.g. 2026-07-01). */
export function formatDuesPeriod(value?: string | null) {
  if (!value) return i18n.t('format.notSet');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(dateTimeLocale(), {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatMoney(amount?: number | null) {
  return new Intl.NumberFormat('en-IN', {
    currency: 'INR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount ?? 0);
}

function compactDecimal(value: number) {
  return value.toFixed(1).replace(/\.0$/, '');
}

export function formatCompactNumber(value?: number | null): string {
  const n = value ?? 0;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);

  if (abs >= 1e7) return `${sign}${compactDecimal(abs / 1e7)}Cr`;
  if (abs >= 1e5) return `${sign}${compactDecimal(abs / 1e5)}L`;
  if (abs >= 1e3) return `${sign}${compactDecimal(abs / 1e3)}k`;
  return `${n}`;
}

export function formatRelativeTime(value?: string | Date | null): string {
  if (!value) return i18n.t('format.notSet');
  const date = toDate(value);
  const diff = Date.now() - date.getTime();

  if (Number.isNaN(date.getTime())) return i18n.t('format.notSet');
  if (diff < 60_000) return i18n.t('format.justNow');
  if (diff < 86_400_000) return formatDistanceToNowStrict(date, { addSuffix: true, locale: dateFnsLocale() });
  if (diff < 172_800_000) return i18n.t('format.yesterday');
  return format(date, 'dd MMM');
}

export function formatDateShort(value?: string | Date | null): string {
  if (!value) return i18n.t('format.notSet');
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return i18n.t('format.notSet');
  return format(date, 'EEE, dd MMM');
}

export function formatTimeRange(start?: string | Date | null, end?: string | Date | null): string {
  if (!start || !end) return i18n.t('format.notSet');
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return i18n.t('format.notSet');
  return `${format(startDate, 'h:mm a')} \u2013 ${format(endDate, 'h:mm a')}`;
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return i18n.t('format.goodMorning');
  if (hour < 17) return i18n.t('format.goodAfternoon');
  return i18n.t('format.goodEvening');
}

export function formatFirstName(name?: string | null, fallback?: string) {
  const resolved = fallback ?? i18n.t('format.greetingFallback');
  return name?.split(' ')[0]?.trim() || resolved;
}

export function titleize(value?: string | null) {
  if (!value) return i18n.t('format.unknown');
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function maskPhone(value?: string | null) {
  if (!value) return i18n.t('format.phoneNotShared');
  const digits = value.replace(/\D/g, '');
  if (digits.length < 6) return value;
  const country = digits.length > 10 ? `+${digits.slice(0, digits.length - 10)} ` : '';
  const local = digits.slice(-10);
  return `${country}${local.slice(0, 2)}••• ••${local.slice(-3)}`;
}

/** Flat numbers in this app often already include the tower prefix (e.g. "A-402"). */
export function formatFlatLabel(
  towerName?: string | null,
  flatNumber?: string | null,
  fallback?: string,
): string {
  const resolvedFallback = fallback ?? i18n.t('format.notLinked');
  const number = flatNumber?.trim();
  const tower = towerName?.trim();

  if (!number) return tower ?? resolvedFallback;
  if (!tower) return number;

  if (number === tower || number.startsWith(`${tower}-`) || number.startsWith(`${tower} `)) {
    return number;
  }

  return `${tower}-${number}`;
}

/** Stable display ticket number from a complaint UUID (e.g. #1024). */
export function formatTicketNumber(id: string): string {
  const hex = id.replace(/-/g, '').slice(-8);
  const num = Number.parseInt(hex, 16) % 10_000;
  return `#${num.toString().padStart(4, '0')}`;
}

export function startOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export function endOfTodayIso() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

export function startOfYesterdayIso() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export function endOfYesterdayIso() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

/** Start of the day N days before today (0 = today). */
export function startOfDaysAgoIso(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export type VisitorLogDateRange = 'today' | 'yesterday' | 'week';

export function visitorLogRangeBounds(range: VisitorLogDateRange) {
  switch (range) {
    case 'yesterday':
      return { start: startOfYesterdayIso(), end: endOfYesterdayIso() };
    case 'week':
      return { start: startOfDaysAgoIso(6), end: endOfTodayIso() };
    default:
      return { start: startOfTodayIso(), end: endOfTodayIso() };
  }
}

/** Start of the current calendar month as a full ISO timestamp. */
export function startOfCurrentMonthIso() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

/** First day of the given month as YYYY-MM-DD (for dues `period` fields). */
export function startOfMonthDate(month: Date) {
  return new Date(month.getFullYear(), month.getMonth(), 1).toISOString().slice(0, 10);
}

export function endOfMonthDate(month: Date) {
  return new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().slice(0, 10);
}
