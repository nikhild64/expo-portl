import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Button, Chip, EmptyState, Screen } from '@/components';
import { ComplaintCard } from '@/features/complaints/ComplaintCard';
import { useComplaints } from '@/queries/useComplaints';

export default function ComplaintsScreen() {
  const [filter, setFilter] = useState<'active' | 'resolved' | 'all'>('active');
  const { data: complaints } = useComplaints(filter);

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <View className="flex-row gap-sm">
        <Chip label="Active" selected={filter === 'active'} onPress={() => setFilter('active')} />
        <Chip label="Resolved" selected={filter === 'resolved'} onPress={() => setFilter('resolved')} />
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
      </View>
      <Button label="Raise complaint" icon="add" onPress={() => router.push('/(resident)/(menu)/complaints/new' as never)} />

      <View className="gap-md">
        {complaints?.length ? (
          complaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              onPress={() => router.push(`/(resident)/(menu)/complaints/${complaint.id}` as never)}
            />
          ))
        ) : (
          <EmptyState icon="construction" title="No complaints" subtitle="Raise a ticket when something needs attention." />
        )}
      </View>
    </Screen>
  );
}
