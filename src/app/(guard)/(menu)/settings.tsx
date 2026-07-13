import { AppSettingsScreen } from '@/features/settings/AppSettingsScreen';

const notificationKeys = [
  { label: 'Visitors', key: 'visitors' as const },
  { label: 'Notices', key: 'notices' as const },
];

export default function GuardSettingsScreen() {
  return <AppSettingsScreen notificationKeys={notificationKeys} />;
}
