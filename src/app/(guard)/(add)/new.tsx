import { Redirect, useLocalSearchParams, useSegments } from 'expo-router';

import { Screen } from '@/components';
import { NewEntryForm } from '@/features/guard/NewEntryForm';
import { visitorTypeSchema, type VisitorType } from '@/features/guard/schemas';
import { useAuthStore } from '@/stores/authStore';

export default function NewEntryScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const segments = useSegments();
  const profile = useAuthStore((s) => s.profile);
  const parsed = visitorTypeSchema.safeParse(params.type);
  const isHomeStack = (segments as readonly string[]).includes('(home)');

  if (!parsed.success) {
    return <Redirect href={isHomeStack ? '/(guard)/(home)' : '/(guard)/(add)'} />;
  }

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 }}>
      <NewEntryForm
        completionBaseHref={isHomeStack ? '/(guard)/(home)/waiting' : '/(guard)/(add)/waiting'}
        guardId={profile?.id}
        societyId={profile?.society_id}
        type={parsed.data as VisitorType}
      />
    </Screen>
  );
}
