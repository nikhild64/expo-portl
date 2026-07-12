import { View, type ViewProps } from 'react-native';

type Variant = 'elevated' | 'filled' | 'outlined';
type Accent = 'none' | 'warning' | 'danger' | 'success';
type Padding = 'sm' | 'base' | 'lg' | 'none';

const variantClass: Record<Variant, string> = {
  elevated: 'bg-surface shadow-elevation-md',
  filled: 'bg-bg-elevated',
  outlined: 'bg-surface border border-border',
};

const accentClass: Record<Accent, string> = {
  none: '',
  warning: 'border-l-[3px] border-l-warning',
  danger: 'border-l-[3px] border-l-error',
  success: 'border-l-[3px] border-l-success',
};

const paddingClass: Record<Padding, string> = {
  none: 'p-0',
  sm: 'p-sm',
  base: 'p-base',
  lg: 'p-lg',
};

interface Props extends ViewProps {
  variant?: Variant;
  accent?: Accent;
  padding?: Padding;
  className?: string;
}

export function Card({
  variant = 'elevated',
  accent = 'none',
  padding = 'base',
  className,
  children,
  style,
  ...rest
}: Props) {
  return (
    <View
      className={`rounded-lg ${variantClass[variant]} ${accentClass[accent]} ${paddingClass[padding]}${className ? ` ${className}` : ''}`}
      style={[{ borderCurve: 'continuous' } as object, style]}
      {...rest}
    >
      {children}
    </View>
  );
}
