import AsyncStorage from '@react-native-async-storage/async-storage';
import { Uniwind } from 'uniwind';

export const THEME_PREFERENCE_KEY = 'appearance:theme';

export type ThemeChoice = 'system' | 'light' | 'dark';

export const DEFAULT_THEME_CHOICE: ThemeChoice = 'dark';

const VALID_THEMES = new Set<ThemeChoice>(['system', 'light', 'dark']);

export async function loadThemePreference(): Promise<ThemeChoice> {
  const saved = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
  return saved && VALID_THEMES.has(saved as ThemeChoice)
    ? (saved as ThemeChoice)
    : DEFAULT_THEME_CHOICE;
}

export async function saveThemePreference(choice: ThemeChoice): Promise<void> {
  await AsyncStorage.setItem(THEME_PREFERENCE_KEY, choice);
}

export function applyThemePreference(choice: ThemeChoice): void {
  Uniwind.setTheme(choice);
}

export async function setThemePreference(choice: ThemeChoice): Promise<void> {
  await saveThemePreference(choice);
  applyThemePreference(choice);
}

applyThemePreference(DEFAULT_THEME_CHOICE);
