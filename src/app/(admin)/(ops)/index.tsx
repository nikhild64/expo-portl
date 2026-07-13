import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components';
import { HelpdeskList } from '@/features/complaints/HelpdeskList';
import { useAuthStore } from '@/stores/authStore';

export default function AdminOpsScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);

  return (
    <View className="flex-1">
      <View className="flex-row gap-md px-base pb-md pt-3">
        <Button label="Dues" variant="tonal" icon="credit_card" full onPress={() => router.push('/(admin)/(ops)/dues')} />
        <Button label="Gate" variant="tonal" icon="qr_code" full onPress={() => router.push('/(admin)/(ops)/gate')} />
      </View>
      <HelpdeskList
        scope="society"
        societyId={societyId}
        onComplaintPress={(id) => router.push(`/(admin)/(ops)/complaints/${id}`)}
      />
    </View>
  );
}
