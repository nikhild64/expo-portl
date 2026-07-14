import { alertError, alertSuccess } from '@/lib/alert';
import type { TFunction } from 'i18next';

export async function upsertWithAlert<T>(input: {
  t: TFunction;
  successTitle: string;
  mutate: () => Promise<T>;
}) {
  try {
    const result = await input.mutate();
    alertSuccess(input.successTitle);
    return result;
  } catch (error) {
    alertError(input.t('alert.titles.saveFailed'), error);
    throw error;
  }
}
