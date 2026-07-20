import { AppSettingsScreen } from '@/features/settings/AppSettingsScreen';

const notificationKeys = [
  { labelKey: 'settings.visitors', key: 'visitors' },
  { labelKey: 'settings.notices', key: 'notices' },
  { labelKey: 'settings.polls', key: 'polls' },
  { labelKey: 'settings.payments', key: 'payments' },
  { labelKey: 'settings.complaints', key: 'complaints' },
] as const;

export default function AdminSettingsScreen() {
  return <AppSettingsScreen notificationKeys={notificationKeys} />;
}
