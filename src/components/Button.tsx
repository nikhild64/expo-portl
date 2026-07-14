import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconSymbol, type IconName } from './IconSymbol';
import { Text } from './Text';

type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const ICON_ACCESSIBILITY_KEYS: Partial<Record<IconName, string>> = {
  add: 'a11y.add',
  arrow_back: 'a11y.goBack',
  arrow_forward: 'a11y.continue',
  calendar_today: 'a11y.calendar',
  check_circle: 'a11y.confirm',
  chevron_right: 'a11y.open',
  close: 'a11y.close',
  credit_card: 'a11y.payments',
  delete: 'a11y.delete',
  edit: 'a11y.edit',
  filter_list: 'a11y.filter',
  more_vert: 'a11y.moreOptions',
  notifications: 'a11y.notifications',
  photo_camera: 'a11y.camera',
  qr_code: 'a11y.qrCode',
  qr_code_scanner: 'a11y.scanQrCode',
  search: 'a11y.search',
  share: 'a11y.share',
  verified_user: 'a11y.verify',
  warning_amber: 'a11y.warning',
  send: 'a11y.sendRequest',
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
  md: 'py-md px-lg min-h-[52px]',
  lg: 'py-base px-xl min-h-[60px]',
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
  const { t } = useTranslation();
  const isSolid = variant === 'filled' || variant === 'danger';
  const iconSize = size === 'sm' ? 16 : 20;
  const contentColor = isSolid ? 'onPrimary' : 'coral';
  const rippleColor = isSolid ? 'rgba(255,255,255,0.2)' : 'rgba(249,112,102,0.15)';
  const resolvedLabel =
    label ?? (icon ? t(ICON_ACCESSIBILITY_KEYS[icon] ?? 'a11y.button') : undefined) ?? t('a11y.button');
  const a11yLabel = loading ? `${resolvedLabel}, ${t('common.loading')}` : (accessibilityLabel ?? resolvedLabel);
  const showLabel = !!label;

  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading }}
      accessibilityLabel={a11yLabel}
      className={[full ? 'min-w-0 self-stretch' : undefined, className].filter(Boolean).join(' ') || undefined}
      android_ripple={{ color: rippleColor }}
    >
      <View
        className={`${full ? 'w-full min-w-0 ' : ''}flex-row items-center justify-center gap-sm rounded-md ${variantContainerClass[variant]} ${sizeClass[size]}${disabled ? ' opacity-40' : ''}`}
        style={{ borderCurve: 'continuous' }}
      >
        {loading ? (
          <ActivityIndicator colorClassName={isSolid ? 'accent-on-primary' : 'accent-coral'} />
        ) : (
          <>
            {icon && iconPosition === 'left' && <IconSymbol name={icon} size={iconSize} color={contentColor} />}
            {showLabel ? (
              <Text
                variant={size === 'sm' ? 'subhead' : 'headline'}
                color={contentColor}
                numberOfLines={1}
                className="shrink text-center"
              >
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
