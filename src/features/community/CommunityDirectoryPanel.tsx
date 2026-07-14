import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Card, EmptyState, IconSymbol, ListRow, SkeletonCard, Text } from '@/components';
import { titleize } from '@/lib/format';
import { useDirectory } from '@/queries/useDirectory';
import { useAuthStore } from '@/stores/authStore';

export function CommunityDirectoryPanel() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { staff, services } = useDirectory(societyId);
  const isEmpty = !staff.data?.length && !services.data?.length;

  if (staff.isLoading || services.isLoading) return <SkeletonCard />;

  return (
    <>
      {isEmpty && (
        <EmptyState icon="phone" title={t('resident.community.noDirectory')} subtitle={t('resident.community.noDirectorySub')} />
      )}

      {!!staff.data?.length && (
        <View className="gap-sm">
          <Text variant="caption" color="textSecondary">
            {t('resident.community.staff')}
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
            {t('resident.community.serviceProviders')}
          </Text>
          <Card padding="none" className="overflow-hidden">
            {services.data.map((provider) => (
              <ListRow
                key={provider.id}
                left={<IconSymbol name="construction" color="coral" />}
                title={provider.name}
                subtitle={`${titleize(provider.category)}${provider.verified ? ` - ${t('common.verified')}` : ''}`}
                right={<IconSymbol name="phone" color="coral" />}
                onPress={() => provider.phone && Linking.openURL(`tel:${provider.phone}`)}
              />
            ))}
          </Card>
        </View>
      )}
    </>
  );
}
