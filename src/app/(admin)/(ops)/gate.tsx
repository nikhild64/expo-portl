import { useState } from 'react';
import { View } from 'react-native';

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
  const filtered = filter === 'all' ? visitors : visitors.filter((visitor) => visitor.status === filter);

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
