import { ScrollView, View, type ViewProps } from 'react-native';
import type { ReactNode } from 'react';

interface Props extends ViewProps {
  scroll?: boolean;
  padded?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Screen({ scroll = false, padded = true, children, className, ...rest }: Props) {
  if (scroll) {
    return (
      <ScrollView
        className={`flex-1 bg-bg${className ? ` ${className}` : ''}`}
        contentContainerClassName={padded ? 'px-base gap-base' : undefined}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View className={`flex-1 bg-bg${padded ? ' px-base' : ''}${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </View>
  );
}
