import { alertError, alertFlatRequired } from '@/lib/alert';
import { router, useSegments } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, ScreenEmpty } from '@/components';
import { PreApprovalForm } from '@/features/visitors/PreApprovalForm';
import { generatePreApprovalCode, type PreApprovalInput } from '@/features/visitors/schemas';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { residentPreApprovalQrHref } from '@/lib/residentRoutes';
import { useCreatePreApproval } from '@/queries/useVisitors';
import { useAuthStore } from '@/stores/authStore';

export default function PreApproveScreen() {
  const { t } = useTranslation();
  const segments = useSegments();
  const profile = useAuthStore((s) => s.profile);
  const { data: primaryFlat } = useMyPrimaryFlat();
  const createPreApproval = useCreatePreApproval();

  const handleSubmit = async (input: PreApprovalInput) => {
    const uid = useAuthStore.getState().session?.user.id;
    const flatId = primaryFlat?.flat_id;

    if (!uid || !flatId) {
      alertFlatRequired(t, 'alert.messages.joinFlatQr');
      return;
    }

    try {
      const countNote = t('resident.preapprove.guestCountNote', { count: Number(input.count) });
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

      router.replace(residentPreApprovalQrHref(preApproval.id, segments));
    } catch (error) {
      alertError(t('alert.titles.couldNotCreateQr'), error);
    }
  };

  if (!profile?.society_id) {
    return (
      <ScreenEmpty
        safe={false}
        icon="apartment"
        title={t('resident.preapprove.societyRequired')}
        subtitle={t('resident.preapprove.societyRequiredSub')}
      />
    );
  }

  return (
    <Screen scroll variant="tab">
      <PreApprovalForm loading={createPreApproval.isPending} onSubmit={handleSubmit} />
    </Screen>
  );
}
