import { Switch, type SwitchProps } from 'react-native';

type Props = Omit<
  SwitchProps,
  'trackColor' | 'thumbColor' | 'ios_backgroundColor' | 'thumbColorClassName' | 'trackColorOnClassName' | 'trackColorOffClassName' | 'ios_backgroundColorClassName'
>;

export function ThemeSwitch({ value, ...rest }: Props) {
  return (
    <Switch
      value={value}
      thumbColorClassName={value ? 'accent-on-primary' : 'accent-surface'}
      trackColorOnClassName="accent-coral"
      trackColorOffClassName="accent-border"
      ios_backgroundColorClassName="accent-surface-tertiary"
      {...rest}
    />
  );
}
