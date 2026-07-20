import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from './EmptyState';
import { SkeletonCard } from './Skeleton';

interface Props extends ScrollViewProps {
  scroll?: boolean;
  padded?: boolean;
  safe?: boolean;
  /** Top inset for tab-root screens that hide the stack header (e.g. guard home). */
  safeTop?: boolean;
  variant?: 'default' | 'tab';
  refreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
  children?: ReactNode;
}

function padding(value: unknown) {
  return typeof value === 'number' ? value : 0;
}

function TabStatusBarFill({ height }: { height: number }) {
  if (height <= 0) return null;

  return (
    <View
      className="absolute left-0 right-0 bg-bg z-50"
      pointerEvents="none"
      style={{ top: 0, height, zIndex: 50 }}
    />
  );
}

function tabShell(className: string | undefined, style: StyleProp<ViewStyle> | undefined, statusBarFill: number, children: ReactNode) {
  return (
    <View className={`flex-1 bg-bg${className ? ` ${className}` : ''}`} style={style}>
      <TabStatusBarFill height={statusBarFill} />
      {children}
    </View>
  );
}

export const TAB_SCREEN_CONTENT_STYLE: ViewStyle = { paddingTop: 12, paddingBottom: 96 };

export const Screen = forwardRef<ScrollView, Props>(function Screen(
  {
    scroll = false,
    padded = true,
    safe = true,
    safeTop = false,
    variant = 'default',
    refreshing,
    onRefresh,
    children,
    className,
    style,
    contentContainerStyle,
    refreshControl,
    ...rest
  },
  ref,
) {
  const insets = useSafeAreaInsets();
  const isTab = variant === 'tab';
  const resolvedSafe = isTab ? false : safe;
  const resolvedSafeTop = isTab && safeTop;
  const statusBarFill = resolvedSafeTop ? insets.top : 0;
  const resolvedContentContainerStyle =
    variant === 'tab'
      ? [TAB_SCREEN_CONTENT_STYLE, contentContainerStyle]
      : contentContainerStyle;
  const topInset = resolvedSafe || resolvedSafeTop ? Math.max(insets.top, 16) : 0;
  const bottomInset = Math.max(insets.bottom, 16);

  if (scroll) {
    const flattenedContentStyle = (StyleSheet.flatten(resolvedContentContainerStyle) || {}) as ViewStyle;
    const safeContentStyle = {
      paddingTop: padding(flattenedContentStyle.paddingTop) + topInset,
      paddingBottom: isTab ? padding(flattenedContentStyle.paddingBottom) : padding(flattenedContentStyle.paddingBottom) + bottomInset,
    };
    const resolvedRefreshControl =
      refreshControl ??
      (onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined);

    const scrollView = (
      <ScrollView
        ref={ref}
        className={`flex-1 bg-bg${!isTab && className ? ` ${className}` : ''}`}
        style={!isTab ? style : undefined}
        contentContainerStyle={[
          padded ? { paddingHorizontal: 16, gap: 16 } : undefined,
          flattenedContentStyle,
          safeContentStyle,
        ]}
        contentInsetAdjustmentBehavior={isTab ? 'never' : 'automatic'}
        keyboardShouldPersistTaps="handled"
        refreshControl={resolvedRefreshControl}
        {...rest}
      >
        {children}
      </ScrollView>
    );

    if (!isTab) return scrollView;

    return tabShell(className, style, statusBarFill, scrollView);
  }

  const flattenedStyle = (StyleSheet.flatten(style) || {}) as ViewStyle;
  const safeStyle = {
    paddingTop: padding(flattenedStyle.paddingTop) + topInset,
    paddingBottom: padding(flattenedStyle.paddingBottom) + bottomInset,
  };

  if (!isTab) {
    return (
      <View
        className={`flex-1 bg-bg${className ? ` ${className}` : ''}`}
        style={[padded ? { paddingHorizontal: 16 } : undefined, style, safeStyle]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return tabShell(
    className,
    [padded ? { paddingHorizontal: 16 } : undefined, style, safeStyle],
    statusBarFill,
    <View className="flex-1 bg-bg">{children}</View>,
  );
});

Screen.displayName = 'Screen';

export function ScreenLoading({
  safe = false,
  safeTop = false,
  variant,
}: {
  safe?: boolean;
  safeTop?: boolean;
  variant?: 'default' | 'tab';
}) {
  return (
    <Screen safe={variant === 'tab' ? false : safe} safeTop={safeTop} variant={variant}>
      <SkeletonCard />
    </Screen>
  );
}

export function ScreenEmpty({
  safe = false,
  safeTop = false,
  variant,
  ...props
}: { safe?: boolean; safeTop?: boolean; variant?: 'default' | 'tab' } & ComponentProps<typeof EmptyState>) {
  return (
    <Screen safe={variant === 'tab' ? false : safe} safeTop={safeTop} variant={variant} className="justify-center">
      <EmptyState {...props} />
    </Screen>
  );
}
