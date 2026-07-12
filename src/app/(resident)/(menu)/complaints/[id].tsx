import { useLocalSearchParams } from 'expo-router';

import { ComplaintDetail } from '@/features/complaints/ComplaintDetail';

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ComplaintDetail complaintId={id} />;
}
