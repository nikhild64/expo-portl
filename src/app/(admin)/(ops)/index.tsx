import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Screen, ScreenLoading } from '@/components';
import { KanbanBoard } from '@/features/admin/KanbanBoard';
import { useAdminComplaints, useUpdateComplaintAdmin } from '@/queries/useAdminComplaints';
import { useAuthStore } from '@/stores/authStore';

export default function AdminOpsScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: complaints = [], isLoading } = useAdminComplaints(societyId);
  const updateComplaint = useUpdateComplaintAdmin();

  if (isLoading) return <ScreenLoading safe={false} />;

  return (
    <Screen safe={false} padded={false}>
      <View className="flex-row gap-md px-base pb-md pt-3">
        <Button label="Dues" variant="tonal" icon="credit_card" full onPress={() => router.push('/(admin)/(ops)/dues')} />
        <Button label="Gate" variant="tonal" icon="qr_code" full onPress={() => router.push('/(admin)/(ops)/gate')} />
      </View>
      <KanbanBoard
        complaints={complaints}
        onUpdateStatus={(id, status) =>
          updateComplaint.mutate({
            id,
            patch: {
              status,
              resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null,
            },
          })
        }
      />
    </Screen>
  );
}
