import { ScrollView, View, type ScrollViewProps } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props extends ScrollViewProps {
  scroll?: boolean;
  padded?: boolean;
  safe?: boolean;
  className?: string;
  children?: ReactNode;
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
  const safeStyle = safe
    ? {
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: Math.max(insets.bottom, 16),
      }
    : undefined;

  if (scroll) {
    return (
      <ScrollView
        className={`flex-1 bg-bg${className ? ` ${className}` : ''}`}
        style={style}
        contentContainerStyle={[
          padded ? { paddingHorizontal: 16, gap: 16 } : undefined,
          safeStyle,
          contentContainerStyle,
        ]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      className={`flex-1 bg-bg${className ? ` ${className}` : ''}`}
      style={[padded ? { paddingHorizontal: 16 } : undefined, safeStyle, style]}
      {...rest}
    >
      {children}
    </View>
  );
}
