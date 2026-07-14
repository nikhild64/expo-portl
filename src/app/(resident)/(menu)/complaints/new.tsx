import { router } from 'expo-router';

import { Screen } from '@/components';
import { ComplaintForm } from '@/features/complaints/ComplaintForm';

export default function NewComplaintScreen() {
  return (
    <Screen scroll variant="tab">
      <ComplaintForm
        onCreated={(id) =>
          router.replace({ pathname: '/(resident)/(menu)/complaints/[id]', params: { id } })
        }
      />
    </Screen>
  );
}
