import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { IconSymbol, type IconName } from './IconSymbol';
import { Text } from './Text';

type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variantContainerClass: Record<Variant, string> = {
  filled: 'bg-coral',
  tonal: 'bg-surface-secondary',
  outlined: 'border border-coral',
  text: '',
  danger: 'bg-error',
};

const sizeClass: Record<Size, string> = {
  sm: 'py-sm px-base min-h-[36px]',
  md: 'py-md px-lg min-h-[48px]',
  lg: 'py-base px-xl min-h-[56px]',
};

interface Props extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  full?: boolean;
  className?: string;
}

export function Button({
  label,
  variant = 'filled',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading,
  full,
  disabled,
  className,
  ...rest
}: Props) {
  const isSolid = variant === 'filled' || variant === 'danger';
  const iconSize = size === 'sm' ? 16 : 20;
  const contentColor = isSolid ? 'onPrimary' : 'coral';
  const rippleColor = isSolid ? 'rgba(255,255,255,0.2)' : 'rgba(249,112,102,0.15)';

  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      className={full ? 'self-stretch' : undefined}
      android_ripple={{ color: rippleColor }}
    >
      <View
        className={`flex-row items-center justify-center gap-sm rounded-md ${variantContainerClass[variant]} ${sizeClass[size]}${disabled ? ' opacity-40' : ''}${className ? ` ${className}` : ''}`}
        style={{ borderCurve: 'continuous' }}
      >
        {loading ? (
          <ActivityIndicator colorClassName={isSolid ? 'accent-on-primary' : 'accent-coral'} />
        ) : (
          <>
            {icon && iconPosition === 'left' && <IconSymbol name={icon} size={iconSize} color={contentColor} />}
            <Text variant={size === 'sm' ? 'subhead' : 'headline'} color={contentColor}>
              {label}
            </Text>
            {icon && iconPosition === 'right' && <IconSymbol name={icon} size={iconSize} color={contentColor} />}
          </>
        )}
      </View>
    </Pressable>
  );
}
