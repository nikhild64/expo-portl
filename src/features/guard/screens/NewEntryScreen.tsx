import { Redirect, useLocalSearchParams, useSegments } from 'expo-router';

import { Screen } from '@/components';
import { NewEntryForm } from '@/features/guard/NewEntryForm';
import { visitorTypeSchema, type VisitorType } from '@/features/guard/schemas';
import { guardStackRoot } from '@/lib/guardRoutes';
import { useAuthStore } from '@/stores/authStore';

export function GuardNewEntryScreen() {
  const params = useLocalSearchParams<{ type?: string; flatId?: string; flatLabel?: string }>();
  const segments = useSegments();
  const profile = useAuthStore((s) => s.profile);
  const parsed = visitorTypeSchema.safeParse(params.type);

  if (!parsed.success) {
    return <Redirect href={guardStackRoot(segments)} />;
  }

  const initialFlat = params.flatId
    ? { id: params.flatId, label: params.flatLabel ? decodeURIComponent(params.flatLabel) : '' }
    : undefined;

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}>
      <NewEntryForm
        guardId={profile?.id}
        initialFlat={initialFlat}
        societyId={profile?.society_id}
        type={parsed.data as VisitorType}
      />
    </Screen>
  );
}
