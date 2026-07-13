import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props extends ScrollViewProps {
  scroll?: boolean;
  padded?: boolean;
  safe?: boolean;
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
  children,
  className,
  style,
  contentContainerStyle,
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
