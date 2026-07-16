jest.mock('@/lib/alert', () => ({
  alertSuccess: jest.fn(),
  alertError: jest.fn(),
}));

import { alertError, alertSuccess } from '@/lib/alert';

import { upsertWithAlert } from './upsertWithAlert';

const t = ((key: string) => key) as any;

describe('upsertWithAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the mutate result and shows a success alert', async () => {
    const result = await upsertWithAlert({
      t,
      successTitle: 'Saved',
      mutate: async () => ({ id: 'row-1' }),
    });

    expect(result).toEqual({ id: 'row-1' });
    expect(alertSuccess).toHaveBeenCalledWith('Saved');
    expect(alertError).not.toHaveBeenCalled();
  });

  it('shows a save-failed alert and rethrows on error', async () => {
    const error = new Error('write failed');

    await expect(
      upsertWithAlert({
        t,
        successTitle: 'Saved',
        mutate: async () => {
          throw error;
        },
      }),
    ).rejects.toThrow('write failed');

    expect(alertSuccess).not.toHaveBeenCalled();
    expect(alertError).toHaveBeenCalledWith('alert.titles.saveFailed', error);
  });
});
