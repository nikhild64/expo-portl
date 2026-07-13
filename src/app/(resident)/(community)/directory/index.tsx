import { ActivityIndicator, Linking, View } from 'react-native';

import { Avatar, Card, EmptyState, IconSymbol, ListRow, Screen, Text } from '@/components';
import { titleize } from '@/lib/format';
import { useDirectory } from '@/queries/useDirectory';
import { useAuthStore } from '@/stores/authStore';

export default function DirectoryScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { staff, services } = useDirectory(societyId);
  const isEmpty = !staff.data?.length && !services.data?.length;

  if (staff.isLoading || services.isLoading) {
    return (
      <Screen safe={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" colorClassName="accent-coral" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      {isEmpty && <EmptyState icon="phone" title="No directory entries" subtitle="Staff and service contacts will appear here." />}

      {!!staff.data?.length && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            STAFF
          </Text>
          <Card padding="none" className="overflow-hidden">
            {staff.data.map((person) => (
              <ListRow
                key={person.id}
                left={<Avatar name={person.name} uri={person.photo_url ?? undefined} size="md" />}
                title={person.name}
                subtitle={titleize(person.role)}
                right={<IconSymbol name="phone" color="coral" />}
                onPress={() => person.phone && Linking.openURL(`tel:${person.phone}`)}
              />
            ))}
          </Card>
        </View>
      )}

      {!!services.data?.length && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            SERVICE PROVIDERS
          </Text>
          <Card padding="none" className="overflow-hidden">
            {services.data.map((provider) => (
              <ListRow
                key={provider.id}
                left={<IconSymbol name="construction" color="coral" />}
                title={provider.name}
                subtitle={`${titleize(provider.category)}${provider.verified ? ' - Verified' : ''}`}
                right={<IconSymbol name="phone" color="coral" />}
                onPress={() => provider.phone && Linking.openURL(`tel:${provider.phone}`)}
              />
            ))}
          </Card>
        </View>
      )}
    </Screen>
  );
}
