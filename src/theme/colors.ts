export const lightColors = {
  bg: '#FEF7F5',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#FFF5F3',
  surfaceTertiary: '#FFEAE6',
  textPrimary: '#1A1412',
  textSecondary: '#6B5750',
  textTertiary: '#9C8A83',
  textInverse: '#FFFFFF',
  coral: '#F97066',
  coralLight: '#FDCBC7',
  sage: '#4ADE80',
  sageLight: '#BBF7D0',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  border: '#E8D8D3',
  borderFocus: '#F97066',
} as const;

type ThemeColorValues = { [K in keyof typeof lightColors]: string };

export const darkColors: ThemeColorValues = {
  bg: '#1A1412',
  bgElevated: '#261E1B',
  surface: '#261E1B',
  surfaceSecondary: '#332824',
  surfaceTertiary: '#3D302C',
  textPrimary: '#FEF7F5',
  textSecondary: '#B8A59E',
  textTertiary: '#8A7972',
  textInverse: '#1A1412',
  coral: '#F97066',
  coralLight: '#5C2420',
  sage: '#4ADE80',
  sageLight: '#1A4D2E',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  border: '#3D302C',
  borderFocus: '#F97066',
};

export type ThemeColor = keyof typeof lightColors;
