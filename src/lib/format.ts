import { format, formatDistanceToNowStrict } from 'date-fns';

export function formatDateTime(value?: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

/** Dues `period` is stored as the 1st of the month (e.g. 2026-07-01). */
export function formatDuesPeriod(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
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
  if (!value) return 'Not set';
  const date = typeof value === 'string' ? new Date(value) : value;
  const diff = Date.now() - date.getTime();

  if (Number.isNaN(date.getTime())) return 'Not set';
  if (diff < 60_000) return 'Just now';
  if (diff < 86_400_000) return formatDistanceToNowStrict(date, { addSuffix: true });
  if (diff < 172_800_000) return 'Yesterday';
  return format(date, 'dd MMM');
}

export function formatDateShort(value?: string | Date | null): string {
  if (!value) return 'Not set';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'Not set';
  return format(date, 'EEE, dd MMM');
}

export function formatTimeRange(start?: string | Date | null, end?: string | Date | null): string {
  if (!start || !end) return 'Not set';
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 'Not set';
  return `${format(startDate, 'h:mm a')} \u2013 ${format(endDate, 'h:mm a')}`;
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function titleize(value?: string | null) {
  if (!value) return 'Unknown';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function maskPhone(value?: string | null) {
  if (!value) return 'Phone not shared';
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
  fallback = 'Not linked',
): string {
  const number = flatNumber?.trim();
  const tower = towerName?.trim();

  if (!number) return tower ?? fallback;
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
