
import { alertError } from '@/lib/alert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components';
import { AmenityForm, type AmenityFormValues } from '@/features/admin/AmenityForm';
import { useUpsertAmenity } from '@/queries/useAmenityMutations';
import { useAuthStore } from '@/stores/authStore';

export default function NewAmenityScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const upsertAmenity = useUpsertAmenity();

  const save = async (values: AmenityFormValues) => {
    if (!societyId) return;
    try {
      await upsertAmenity.mutateAsync({
        active: values.active,
        available_from: values.availableFrom,
        available_to: values.availableTo,
        blackout_dates: [],
        capacity: values.capacity ?? null,
        cover_image_url: values.coverImageUrl || null,
        daily_price: values.dailyPrice ?? 0,
        deposit: values.deposit ?? 0,
        description: values.description || null,
        hourly_price: values.hourlyPrice ?? 0,
        name: values.name,
        rules_text: values.rulesText || null,
        society_id: societyId,
      });
      router.back();
    } catch (error) {
      alertError(t('alert.titles.saveFailed'), error);
    }
  };

  return (
    <Screen scroll variant="tab">
      <AmenityForm loading={upsertAmenity.isPending} onSubmit={save} />
    </Screen>
  );
}
