import { router, type Href } from 'expo-router';

import { Card, ListRow, Screen } from '@/components';

export default function AdminCommunityScreen() {
  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card padding="none" className="overflow-hidden">
        <ListRow title="Notices" subtitle="Publish notices and drafts" showChevron onPress={() => router.push('/(admin)/(community)/notices' as Href)} />
        <ListRow title="Polls" subtitle="Create polls and review participation" showChevron onPress={() => router.push('/(admin)/(community)/polls' as Href)} />
        <ListRow title="Amenities" subtitle="Manage amenities and bookings" showChevron onPress={() => router.push('/(admin)/(community)/amenities' as Href)} />
      </Card>
    </Screen>
  );
}
