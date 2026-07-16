import AsyncStorage from '@react-native-async-storage/async-storage';

let mockEnableHindi = false;

jest.mock('@/env', () => ({
  get env() {
    return { enableHindi: mockEnableHindi };
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockChangeLanguage = jest.fn();
jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { changeLanguage: (...args: unknown[]) => mockChangeLanguage(...args) },
}));

const mockGetSession = jest.fn();
const mockRpc = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: (...args: unknown[]) => mockGetSession(...args) },
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import {
  applyLocalePreference,
  isHindiEnabled,
  loadLocalePreference,
  LOCALE_PREFERENCE_KEY,
  saveLocalePreference,
  setLocalePreference,
  syncLocalePreferenceToProfile,
} from './localePreference';

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('localePreference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnableHindi = false;
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockRpc.mockResolvedValue({ error: null });
    storage.getItem.mockResolvedValue(null);
    storage.setItem.mockResolvedValue(undefined);
  });

  describe('isHindiEnabled', () => {
    it('reflects the env flag', () => {
      expect(isHindiEnabled()).toBe(false);
      mockEnableHindi = true;
      expect(isHindiEnabled()).toBe(true);
    });
  });

  describe('loadLocalePreference', () => {
    it('returns en when Hindi is disabled', async () => {
      storage.getItem.mockResolvedValue('hi');
      expect(await loadLocalePreference()).toBe('en');
      expect(storage.getItem).not.toHaveBeenCalled();
    });

    it('returns saved locale when Hindi is enabled', async () => {
      mockEnableHindi = true;
      storage.getItem.mockResolvedValue('hi');
      expect(await loadLocalePreference()).toBe('hi');
      expect(storage.getItem).toHaveBeenCalledWith(LOCALE_PREFERENCE_KEY);
    });

    it('falls back to en for invalid stored values', async () => {
      mockEnableHindi = true;
      storage.getItem.mockResolvedValue('fr');
      expect(await loadLocalePreference()).toBe('en');
    });
  });

  describe('saveLocalePreference', () => {
    it('persists the locale key', async () => {
      await saveLocalePreference('hi');
      expect(storage.setItem).toHaveBeenCalledWith(LOCALE_PREFERENCE_KEY, 'hi');
    });
  });

  describe('applyLocalePreference', () => {
    it('changes i18n language', () => {
      applyLocalePreference('hi');
      expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
    });
  });

  describe('setLocalePreference', () => {
    it('no-ops non-English locales when Hindi is disabled', async () => {
      await setLocalePreference('hi');
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(mockChangeLanguage).not.toHaveBeenCalled();
    });

    it('saves, applies, and syncs when Hindi is enabled', async () => {
      mockEnableHindi = true;
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });

      await setLocalePreference('hi');

      expect(storage.setItem).toHaveBeenCalledWith(LOCALE_PREFERENCE_KEY, 'hi');
      expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
      await Promise.resolve();
      expect(mockRpc).toHaveBeenCalledWith('update_preferred_locale', { p_locale: 'hi' });
    });

    it('retries profile sync on JWT clock skew', async () => {
      jest.useFakeTimers();
      mockEnableHindi = true;
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
      mockRpc
        .mockResolvedValueOnce({ error: { message: 'jwt issued at future' } })
        .mockResolvedValueOnce({ error: null });

      await setLocalePreference('hi');
      await Promise.resolve();

      expect(mockRpc).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1000);
      await Promise.resolve();

      expect(mockRpc).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });
  });

  describe('syncLocalePreferenceToProfile', () => {
    it('syncs en when Hindi is disabled', async () => {
      storage.getItem.mockResolvedValue('hi');
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });

      await syncLocalePreferenceToProfile();

      expect(mockRpc).toHaveBeenCalledWith('update_preferred_locale', { p_locale: 'en' });
    });

    it('syncs stored locale when Hindi is enabled', async () => {
      mockEnableHindi = true;
      storage.getItem.mockResolvedValue('hi');
      mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });

      await syncLocalePreferenceToProfile();

      expect(mockRpc).toHaveBeenCalledWith('update_preferred_locale', { p_locale: 'hi' });
    });

    it('skips sync when there is no session', async () => {
      await syncLocalePreferenceToProfile();
      expect(mockRpc).not.toHaveBeenCalled();
    });
  });
});
