import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { Button, Screen, SkeletonCard } from '@/components';
import { KanbanBoard } from '@/features/admin/KanbanBoard';
import { useAdminComplaints, useUpdateComplaintAdmin } from '@/queries/useAdminComplaints';
import { useAuthStore } from '@/stores/authStore';

export default function AdminOpsScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: complaints = [], isLoading } = useAdminComplaints(societyId);
  const updateComplaint = useUpdateComplaintAdmin();

  if (isLoading) return <SkeletonCard />;

  return (
    <Screen safe={false} padded={false}>
      <View className="flex-row gap-md px-base pb-md pt-3">
        <Button label="Dues" variant="tonal" icon="credit_card" full onPress={() => router.push('/(admin)/(ops)/dues' as Href)} />
        <Button label="Gate" variant="tonal" icon="qr_code" full onPress={() => router.push('/(admin)/(ops)/gate' as Href)} />
      </View>
      <KanbanBoard complaints={complaints} onUpdateStatus={(id, status) => updateComplaint.mutate({ id, patch: { status } })} />
    </Screen>
  );
}
