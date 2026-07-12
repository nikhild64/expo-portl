import { Redirect, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components';
import { NewEntryForm } from '@/features/guard/NewEntryForm';
import { visitorTypeSchema, type VisitorType } from '@/features/guard/schemas';
import { useAuthStore } from '@/stores/authStore';

export default function NewEntryScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const profile = useAuthStore((s) => s.profile);
  const parsed = visitorTypeSchema.safeParse(params.type);

  if (!parsed.success) {
    return <Redirect href="/(guard)/(add)" />;
  }

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}>
      <NewEntryForm guardId={profile?.id} societyId={profile?.society_id} type={parsed.data as VisitorType} />
    </Screen>
  );
}
