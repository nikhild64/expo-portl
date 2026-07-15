import { Screen } from '@/components';
import { ComplaintForm } from '@/features/complaints/ComplaintForm';
import { useResidentNavigation } from '@/lib/useResidentNavigation';

export default function NewComplaintScreen() {
  const residentNav = useResidentNavigation();

  return (
    <Screen scroll variant="tab">
      <ComplaintForm
        onCreated={(id) => residentNav.replace('complaints', id)}
      />
    </Screen>
  );
}
