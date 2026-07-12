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

export function formatMoney(amount?: number | null) {
  return new Intl.NumberFormat('en-IN', {
    currency: 'INR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount ?? 0);
}

export function titleize(value?: string | null) {
  if (!value) return 'Unknown';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
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
