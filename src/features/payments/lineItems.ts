import i18n from '@/i18n';
import type { Json } from '@/types/database';

export interface DuesLineItem {
  amount: number;
  label: string;
}

export function lineItemsToJson(items: DuesLineItem[]): Json {
  return items as unknown as Json;
}

export function parseLineItems(value: Json): DuesLineItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, Json>;
      const label = String(record.label ?? record.name ?? record.type ?? i18n.t('resident.payments.defaultChargeLabel'));
      const amount = Number(record.amount ?? 0);
      return { amount, label };
    })
    .filter((item): item is DuesLineItem => !!item);
}
