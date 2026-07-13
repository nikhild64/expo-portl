import { RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import type { ComponentProps, ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from './EmptyState';
import { SkeletonCard } from './Skeleton';

interface Props extends ScrollViewProps {
  scroll?: boolean;
  padded?: boolean;
  safe?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
  children?: ReactNode;
}

function padding(value: unknown) {
  return typeof value === 'number' ? value : 0;
}

export function Screen({
  scroll = false,
  padded = true,
  safe = true,
  refreshing,
  onRefresh,
  children,
  className,
  style,
  contentContainerStyle,
  refreshControl,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();
  const topInset = safe ? Math.max(insets.top, 16) : 0;
  const bottomInset = Math.max(insets.bottom, 16);

  if (scroll) {
    const flattenedContentStyle = StyleSheet.flatten(contentContainerStyle) ?? {};
    const safeContentStyle = {
      paddingTop: padding(flattenedContentStyle.paddingTop) + topInset,
      paddingBottom: padding(flattenedContentStyle.paddingBottom) + bottomInset,
    };
    const resolvedRefreshControl =
      refreshControl ??
      (onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined);

    return (
      <ScrollView
        className={`flex-1 bg-bg${className ? ` ${className}` : ''}`}
        style={style}
        contentContainerStyle={[
          padded ? { paddingHorizontal: 16, gap: 16 } : undefined,
          contentContainerStyle,
          safeContentStyle,
        ]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshControl={resolvedRefreshControl}
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  const flattenedStyle = StyleSheet.flatten(style) ?? {};
  const safeStyle = {
    paddingTop: padding(flattenedStyle.paddingTop) + topInset,
    paddingBottom: padding(flattenedStyle.paddingBottom) + bottomInset,
  };

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

export function ScreenLoading({ safe = false }: { safe?: boolean }) {
  return (
    <Screen safe={safe}>
      <SkeletonCard />
    </Screen>
  );
}

export function ScreenEmpty({
  safe = false,
  ...props
}: { safe?: boolean } & ComponentProps<typeof EmptyState>) {
  return (
    <Screen safe={safe} className="justify-center">
      <EmptyState {...props} />
    </Screen>
  );
}
