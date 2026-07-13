import { Screen } from '@/components';
import { NotificationList } from '@/features/notifications/NotificationList';

export default function GuardNotificationsScreen() {
  return (
    <Screen safe={false} padded={false}>
      <NotificationList />
    </Screen>
  );
}
