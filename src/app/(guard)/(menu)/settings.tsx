import { AppSettingsScreen } from '@/features/settings/AppSettingsScreen';

const notificationKeys = [
  { labelKey: 'settings.visitors', key: 'visitors' },
  { labelKey: 'settings.notices', key: 'notices' },
] as const;

export default function GuardSettingsScreen() {
  return <AppSettingsScreen notificationKeys={notificationKeys} />;
}
