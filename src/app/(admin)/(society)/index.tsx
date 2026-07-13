import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router, type Href } from 'expo-router';

import { Button, Chip, EmptyState, Field, Screen, ScreenLoading, Text } from '@/components';
import { ResidentRow } from '@/features/admin/ResidentRow';
import { useAdminResidents, type ResidentStatusFilter } from '@/queries/useAdminResidents';
import { useTowers } from '@/queries/useTowers';
import { useAuthStore } from '@/stores/authStore';

const statuses: ResidentStatusFilter[] = ['all', 'active', 'pending', 'blocked'];

export default function AdminSocietyScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ResidentStatusFilter>('all');
  const [towerId, setTowerId] = useState('all');
  const { data: towers = [] } = useTowers(societyId);
  const { data: residents = [], isLoading } = useAdminResidents(societyId, { search, status, towerId });

  const towerChips = useMemo(() => [{ id: 'all', name: 'All' }, ...towers], [towers]);

  if (isLoading) return <ScreenLoading safe={false} />;

  return (
    <Screen safe={false} padded={false}>
      <View className="gap-md px-base pb-md pt-3">
        <Field value={search} onChangeText={setSearch} placeholder="Search residents" />
        <View className="flex-row flex-wrap gap-sm">
          {statuses.map((item) => (
            <Chip key={item} label={item} selected={status === item} onPress={() => setStatus(item)} />
          ))}
        </View>
        <View className="flex-row flex-wrap gap-sm">
          {towerChips.map((tower) => (
            <Chip key={tower.id} label={tower.name} selected={towerId === tower.id} onPress={() => setTowerId(tower.id)} />
          ))}
        </View>
        <View className="flex-row gap-md">
          <Button label="Pending" variant="tonal" icon="verified_user" full onPress={() => router.push('/(admin)/(society)/pending' as Href)} />
          <Button label="Add resident" variant="outlined" icon="add" full onPress={() => router.push('/(admin)/(society)/pending' as Href)} />
        </View>
        <View className="flex-row gap-md">
          <Button label="Services" variant="tonal" icon="construction" full onPress={() => router.push('/(admin)/(society)/services' as Href)} />
          <Button label="Staff" variant="tonal" icon="person" full onPress={() => router.push('/(admin)/(society)/staff' as Href)} />
        </View>
      </View>

      <FlashList
        data={residents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <Text variant="caption" color="textSecondary" className="pb-sm">
            {residents.length} resident{residents.length === 1 ? '' : 's'}
          </Text>
        }
        ListEmptyComponent={<EmptyState icon="groups" title="No residents found" subtitle="Try another filter or review pending join requests." />}
        renderItem={({ item }) => <ResidentRow resident={item} onPress={() => router.push(`/(admin)/(society)/residents/${item.id}` as Href)} />}
      />
    </Screen>
  );
}
