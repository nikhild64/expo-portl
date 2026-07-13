import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, ListRow, Screen } from '@/components';

export default function AdminCommunityScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card padding="none" className="overflow-hidden">
        <ListRow title={t('nav.screens.notices')} subtitle={t('admin.community.newNotice')} showChevron onPress={() => router.push('/(admin)/(community)/notices')} />
        <ListRow title={t('nav.screens.polls')} subtitle={t('admin.community.newPoll')} showChevron onPress={() => router.push('/(admin)/(community)/polls')} />
        <ListRow title={t('nav.screens.amenities')} subtitle={t('admin.community.bookingsCalendar')} showChevron onPress={() => router.push('/(admin)/(community)/amenities')} />
      </Card>
    </Screen>
  );
}
