import { Alert } from 'react-native';
import { router, type Href } from 'expo-router';

import { EmptyState, Screen } from '@/components';
import { PreApprovalForm } from '@/features/visitors/PreApprovalForm';
import { generatePreApprovalCode, type PreApprovalInput } from '@/features/visitors/schemas';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { useCreatePreApproval } from '@/queries/useVisitors';
import { useAuthStore } from '@/stores/authStore';

export default function PreApproveScreen() {
  const profile = useAuthStore((s) => s.profile);
  const { data: primaryFlat } = useMyPrimaryFlat();
  const createPreApproval = useCreatePreApproval();

  const handleSubmit = async (input: PreApprovalInput) => {
    const uid = useAuthStore.getState().session?.user.id;
    const flatId = primaryFlat?.flat_id;

    if (!uid || !flatId) {
      Alert.alert('Flat required', 'Join or select a flat before creating visitor QR codes.');
      return;
    }

    try {
      const countNote = `Guest count: ${Number(input.count)}`;
      const notes = [countNote, input.notes?.trim()].filter(Boolean).join('\n');
      const preApproval = await createPreApproval.mutateAsync({
        code: generatePreApprovalCode(),
        created_by_profile_id: uid,
        end_at: input.endAt,
        flat_id: flatId,
        notes,
        recurring: false,
        start_at: input.startAt,
        type: input.type,
        vehicle_plate: input.hasVehicle ? input.vehiclePlate?.trim() || null : null,
        visitor_name: input.visitorName.trim(),
        visitor_phone: input.visitorPhone?.trim() || null,
      });

      router.replace(`/(resident)/(approvals)/preapprove/${preApproval.id}/qr` as Href);
    } catch (error) {
      Alert.alert('Could not create QR', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  if (!profile?.society_id) {
    return <EmptyState icon="apartment" title="Society required" subtitle="Complete approval before creating visitor QR codes." />;
  }

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <PreApprovalForm loading={createPreApproval.isPending} onSubmit={handleSubmit} />
    </Screen>
  );
}
