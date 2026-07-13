import { useState } from 'react';
import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Button, Chip, EmptyState, Screen, SkeletonCard } from '@/components';
import { ComplaintCard } from '@/features/complaints/ComplaintCard';
import { useComplaints } from '@/queries/useComplaints';
import { useQueryRefresh } from '@/queries/useNotificationPreferences';

export default function ComplaintsScreen() {
  const [filter, setFilter] = useState<'active' | 'resolved' | 'all'>('active');
  const { data: complaints, isLoading } = useComplaints(filter);
  const { refreshing, refresh } = useQueryRefresh([['complaints', filter]]);

  return (
    <Screen scroll safe={false} refreshing={refreshing} onRefresh={refresh} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <View className="flex-row gap-sm">
        <Chip label="Active" selected={filter === 'active'} onPress={() => setFilter('active')} />
        <Chip label="Resolved" selected={filter === 'resolved'} onPress={() => setFilter('resolved')} />
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
      </View>
      <Button label="Raise complaint" icon="add" onPress={() => router.push('/(resident)/(menu)/complaints/new' as Href)} />

      <View className="gap-md">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : complaints?.length ? (
          complaints.map((complaint, index) => (
            <Animated.View
              key={complaint.id}
              entering={FadeInDown.delay(Math.min(index, 6) * 30).duration(200)}
              layout={LinearTransition}
            >
              <ComplaintCard
                complaint={complaint}
                onPress={() => router.push(`/(resident)/(menu)/complaints/${complaint.id}` as Href)}
              />
            </Animated.View>
          ))
        ) : (
          <EmptyState icon="construction" title="No complaints" subtitle="Raise a ticket when something needs attention." />
        )}
      </View>
    </Screen>
  );
}
