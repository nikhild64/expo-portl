import { AppSettingsScreen } from '@/features/settings/AppSettingsScreen';

const notificationKeys = [
  { labelKey: 'settings.visitors', key: 'visitors' },
  { labelKey: 'settings.polls', key: 'polls' },
] as const;

export default function GuardSettingsScreen() {
  return <AppSettingsScreen notificationKeys={notificationKeys} />;
}
