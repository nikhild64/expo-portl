import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { IconSymbol, type IconName } from './IconSymbol';
import { Text } from './Text';

type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const ICON_ACCESSIBILITY_LABELS: Partial<Record<IconName, string>> = {
  add: 'Add',
  arrow_back: 'Go back',
  arrow_forward: 'Continue',
  calendar_today: 'Calendar',
  check_circle: 'Confirm',
  chevron_right: 'Open',
  close: 'Close',
  credit_card: 'Payments',
  delete: 'Delete',
  edit: 'Edit',
  filter_list: 'Filter',
  more_vert: 'More options',
  notifications: 'Notifications',
  photo_camera: 'Camera',
  qr_code: 'QR code',
  qr_code_scanner: 'Scan QR code',
  search: 'Search',
  share: 'Share',
  verified_user: 'Verify',
  warning_amber: 'Warning',
  send: 'Send request',
};

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
  label?: string;
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
  accessibilityLabel,
  ...rest
}: Props) {
  const isSolid = variant === 'filled' || variant === 'danger';
  const iconSize = size === 'sm' ? 16 : 20;
  const contentColor = isSolid ? 'onPrimary' : 'coral';
  const rippleColor = isSolid ? 'rgba(255,255,255,0.2)' : 'rgba(249,112,102,0.15)';
  const resolvedLabel = label ?? (icon ? ICON_ACCESSIBILITY_LABELS[icon] : undefined) ?? 'Button';
  const a11yLabel = loading ? `${resolvedLabel}, Loading` : (accessibilityLabel ?? resolvedLabel);
  const showLabel = !!label;

  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading }}
      accessibilityLabel={a11yLabel}
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
            {showLabel ? (
              <Text variant={size === 'sm' ? 'subhead' : 'headline'} color={contentColor}>
                {label}
              </Text>
            ) : null}
            {icon && iconPosition === 'right' && <IconSymbol name={icon} size={iconSize} color={contentColor} />}
          </>
        )}
      </View>
    </Pressable>
  );
}
