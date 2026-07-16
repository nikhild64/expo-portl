jest.mock('uniwind', () => ({
  Uniwind: { setTheme: jest.fn() },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Uniwind } from 'uniwind';

import {
  applyThemePreference,
  DEFAULT_THEME_CHOICE,
  loadThemePreference,
  saveThemePreference,
  setThemePreference,
  THEME_PREFERENCE_KEY,
} from './themePreference';

const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('themePreference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.getItem.mockResolvedValue(null);
    storage.setItem.mockResolvedValue(undefined);
  });

  it('loads the default theme when storage is empty', async () => {
    await expect(loadThemePreference()).resolves.toBe(DEFAULT_THEME_CHOICE);
  });

  it('loads a saved valid theme choice', async () => {
    storage.getItem.mockResolvedValue('light');
    await expect(loadThemePreference()).resolves.toBe('light');
  });

  it('falls back to default for invalid stored values', async () => {
    storage.getItem.mockResolvedValue('neon');
    await expect(loadThemePreference()).resolves.toBe(DEFAULT_THEME_CHOICE);
  });

  it('persists and applies theme changes', async () => {
    await setThemePreference('system');

    expect(storage.setItem).toHaveBeenCalledWith(THEME_PREFERENCE_KEY, 'system');
    expect(Uniwind.setTheme).toHaveBeenCalledWith('system');
  });

  it('applies a theme without persisting', () => {
    applyThemePreference('light');
    expect(Uniwind.setTheme).toHaveBeenCalledWith('light');
  });

  it('saves theme preference to storage', async () => {
    await saveThemePreference('dark');
    expect(storage.setItem).toHaveBeenCalledWith(THEME_PREFERENCE_KEY, 'dark');
  });
});
