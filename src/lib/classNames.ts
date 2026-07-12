import type { ThemeColor } from '@/theme/colors';
import type { Typography } from '@/theme/tokens';

/** Static class maps — every key is a complete literal for Uniwind build-time scanning. */
export const typographyClass: Record<Typography, string> = {
  display: 'text-display',
  titleLarge: 'text-title-large',
  title: 'text-title',
  headline: 'text-headline',
  body: 'text-body',
  callout: 'text-callout',
  subhead: 'text-subhead',
  footnote: 'text-footnote',
  caption: 'text-caption',
};

export const colorClass: Record<ThemeColor, string> = {
  bg: 'text-bg',
  bgElevated: 'text-bg-elevated',
  surface: 'text-surface',
  surfaceSecondary: 'text-surface-secondary',
  surfaceTertiary: 'text-surface-tertiary',
  textPrimary: 'text-text-primary',
  textSecondary: 'text-text-secondary',
  textTertiary: 'text-text-tertiary',
  textInverse: 'text-text-inverse',
  onPrimary: 'text-on-primary',
  coral: 'text-coral',
  coralLight: 'text-coral-light',
  sage: 'text-sage',
  sageLight: 'text-sage-light',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
  border: 'text-border',
  borderFocus: 'text-border-focus',
};

/** CSS variable names for useCSSVariable / gorhom bottom-sheet props */
export const colorVariable: Record<ThemeColor, `--color-${string}`> = {
  bg: '--color-bg',
  bgElevated: '--color-bg-elevated',
  surface: '--color-surface',
  surfaceSecondary: '--color-surface-secondary',
  surfaceTertiary: '--color-surface-tertiary',
  textPrimary: '--color-text-primary',
  textSecondary: '--color-text-secondary',
  textTertiary: '--color-text-tertiary',
  textInverse: '--color-text-inverse',
  onPrimary: '--color-on-primary',
  coral: '--color-coral',
  coralLight: '--color-coral-light',
  sage: '--color-sage',
  sageLight: '--color-sage-light',
  success: '--color-success',
  warning: '--color-warning',
  error: '--color-error',
  info: '--color-info',
  border: '--color-border',
  borderFocus: '--color-border-focus',
};
