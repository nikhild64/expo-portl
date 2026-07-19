import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

import { Button, Chip, EmptyState, Field, Screen, ScreenLoading, Text } from '@/components';
import { SmallGapSeparator } from '@/components/listSeparators';
import { ResidentRow } from '@/features/admin/ResidentRow';
import { useAdminNavigation } from '@/lib/useAdminNavigation';
import { useAdminResidents, type ResidentStatusFilter } from '@/queries/useAdminResidents';
import { useTowers } from '@/queries/useTowers';
import { useAuthStore } from '@/stores/authStore';

const statuses: ResidentStatusFilter[] = ['all', 'active', 'pending', 'blocked'];

export default function AdminSocietyScreen() {
  const { t } = useTranslation();
  const adminNav = useAdminNavigation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ResidentStatusFilter>('all');
  const [towerId, setTowerId] = useState('all');
  const { data: towers = [] } = useTowers(societyId);
  const { data: residents = [], isLoading } = useAdminResidents(societyId, { search, status, towerId });

  const towerChips = useMemo(() => [{ id: 'all', name: t('common.all') }, ...towers], [t, towers]);

  if (isLoading) return <ScreenLoading variant="tab" safeTop />;

  return (
    <Screen variant="tab" safeTop padded={false}>
      <View className="gap-md px-base pb-md pt-3">
        <Field value={search} onChangeText={setSearch} placeholder={t('admin.society.searchResidents')} />
        <View className="flex-row flex-wrap gap-sm">
          {statuses.map((item) => (
            <Chip key={item} label={item === 'all' ? t('common.all') : t(`status.${item}`)} selected={status === item} onPress={() => setStatus(item)} />
          ))}
        </View>
        <View className="flex-row flex-wrap gap-sm">
          {towerChips.map((tower) => (
            <Chip key={tower.id} label={tower.name} selected={towerId === tower.id} onPress={() => setTowerId(tower.id)} />
          ))}
        </View>
        <View className="flex-row gap-md">
          <View className="min-w-0 flex-1">
            <Button label={t('admin.society.pending')} variant="tonal" icon="verified_user" full onPress={() => adminNav.push('pending')} />
          </View>
          <View className="min-w-0 flex-1">
            <Button label={t('admin.society.guards')} variant="tonal" icon="verified_user" full onPress={() => adminNav.push('guards')} />
          </View>
        </View>
        <View className="flex-row gap-md">
          <View className="min-w-0 flex-1">
            <Button label={t('admin.society.services')} variant="tonal" icon="construction" full onPress={() => adminNav.push('services')} />
          </View>
          <View className="min-w-0 flex-1">
            <Button label={t('admin.society.staff')} variant="tonal" icon="person" full onPress={() => adminNav.push('staff')} />
          </View>
        </View>
        <View className="flex-row gap-md">
          <View className="min-w-0 flex-1">
            <Button label={t('nav.screens.towers')} variant="tonal" icon="apartment" full onPress={() => adminNav.push('towers')} />
          </View>
          <View className="min-w-0 flex-1">
            <Button label={t('admin.society.inviteToFlat')} variant="tonal" icon="person_add" full onPress={() => adminNav.push('invite' as any)} />
          </View>
        </View>
      </View>

      <FlashList
        data={residents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
        ItemSeparatorComponent={SmallGapSeparator}
        ListHeaderComponent={
          <Text variant="caption" color="textSecondary" className="pb-sm">
            {residents.length} {t('nav.screens.resident').toLowerCase()}
            {residents.length === 1 ? '' : 's'}
          </Text>
        }
        ListEmptyComponent={
          <EmptyState icon="groups" title={t('admin.society.noResidents')} subtitle={t('admin.society.noResidentsSub')} />
        }
        renderItem={({ item }) => (
          <ResidentRow resident={item} onPress={() => adminNav.push('residents', item.id)} />
        )}
      />
    </Screen>
  );
}
