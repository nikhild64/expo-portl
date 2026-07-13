import { useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Chip, Screen } from '@/components';
import { LiveGateFeed } from '@/features/admin/LiveGateFeed';
import { useLiveGateFeed } from '@/queries/useAdminVisitors';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

type Filter = Tables<'visitors'>['status'] | 'all';
const filters: Filter[] = ['all', 'pending', 'entered', 'exited'];

export default function AdminGateScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const [filter, setFilter] = useState<Filter>('all');
  const visitors = useLiveGateFeed(societyId);
  const hasLoaded = useRef(false);
  if (visitors.length > 0) hasLoaded.current = true;
  const filtered = filter === 'all' ? visitors : visitors.filter((visitor) => visitor.status === filter);

  if (!hasLoaded.current && visitors.length === 0) {
    return (
      <Screen safe={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97066" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <View className="flex-row flex-wrap gap-sm">
        {filters.map((item) => (
          <Chip key={item} label={item} selected={filter === item} onPress={() => setFilter(item)} />
        ))}
      </View>
      <LiveGateFeed visitors={filtered} />
    </Screen>
  );
}
