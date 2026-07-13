import { useCSSVariable } from 'uniwind';

import { colorVariable } from '@/lib/classNames';

import type { ThemeColor } from './colors';

export type ThemeColors = Record<ThemeColor, string>;

/** Resolved theme palette — always matches the active Uniwind theme. */
export function useThemeColors(): ThemeColors {
  const bg = useCSSVariable(colorVariable.bg) as string;
  const bgElevated = useCSSVariable(colorVariable.bgElevated) as string;
  const surface = useCSSVariable(colorVariable.surface) as string;
  const surfaceSecondary = useCSSVariable(colorVariable.surfaceSecondary) as string;
  const surfaceTertiary = useCSSVariable(colorVariable.surfaceTertiary) as string;
  const textPrimary = useCSSVariable(colorVariable.textPrimary) as string;
  const textSecondary = useCSSVariable(colorVariable.textSecondary) as string;
  const textTertiary = useCSSVariable(colorVariable.textTertiary) as string;
  const textInverse = useCSSVariable(colorVariable.textInverse) as string;
  const onPrimary = useCSSVariable(colorVariable.onPrimary) as string;
  const coral = useCSSVariable(colorVariable.coral) as string;
  const coralLight = useCSSVariable(colorVariable.coralLight) as string;
  const sage = useCSSVariable(colorVariable.sage) as string;
  const sageLight = useCSSVariable(colorVariable.sageLight) as string;
  const success = useCSSVariable(colorVariable.success) as string;
  const warning = useCSSVariable(colorVariable.warning) as string;
  const error = useCSSVariable(colorVariable.error) as string;
  const info = useCSSVariable(colorVariable.info) as string;
  const border = useCSSVariable(colorVariable.border) as string;
  const borderFocus = useCSSVariable(colorVariable.borderFocus) as string;

  return {
    bg,
    bgElevated,
    surface,
    surfaceSecondary,
    surfaceTertiary,
    textPrimary,
    textSecondary,
    textTertiary,
    textInverse,
    onPrimary,
    coral,
    coralLight,
    sage,
    sageLight,
    success,
    warning,
    error,
    info,
    border,
    borderFocus,
  };
}
