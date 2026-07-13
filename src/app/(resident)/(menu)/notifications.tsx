import { Screen } from '@/components';
import { NotificationList } from '@/features/notifications/NotificationList';

export default function ResidentNotificationsScreen() {
  return (
    <Screen safe={false} padded={false}>
      <NotificationList />
    </Screen>
  );
}
