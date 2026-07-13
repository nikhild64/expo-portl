import { router, type Href } from 'expo-router';

import { Screen } from '@/components';
import { ComplaintForm } from '@/features/complaints/ComplaintForm';

export default function NewComplaintScreen() {
  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <ComplaintForm onCreated={(id) => router.replace(`/(resident)/(menu)/complaints/${id}` as Href)} />
    </Screen>
  );
}
