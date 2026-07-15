import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/** Standard push transition — soft cross-fade. */
export const stackTransition: NativeStackNavigationOptions = {
  animation: 'fade',
  animationDuration: 280,
  fullScreenGestureEnabled: true,
  gestureEnabled: true,
};

/** Bottom sheet / modal entry. */
export const sheetTransition: NativeStackNavigationOptions = {
  animation: 'fade',
  animationDuration: 280,
  gestureEnabled: true,
  presentation: 'formSheet',
  sheetAllowedDetents: [0.92, 1],
  sheetGrabberVisible: true,
};

export function themedStackScreenOptions(bg: string, text: string): NativeStackNavigationOptions {
  return {
    ...stackTransition,
    contentStyle: { backgroundColor: bg },
    headerLargeStyle: { backgroundColor: bg },
    headerLargeTitleShadowVisible: false,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: bg },
    headerTintColor: text,
    headerTitleStyle: { color: text },
  };
}
