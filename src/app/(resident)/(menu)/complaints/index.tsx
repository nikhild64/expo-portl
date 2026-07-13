import { router } from 'expo-router';

import { HelpdeskList } from '@/features/complaints/HelpdeskList';

export default function ComplaintsScreen() {
  return (
    <HelpdeskList
      scope="mine"
      onComplaintPress={(id) =>
        router.push({ pathname: '/(resident)/(menu)/complaints/[id]', params: { id } })
      }
      onRaiseTicket={() => router.push('/(resident)/(menu)/complaints/new')}
    />
  );
}
