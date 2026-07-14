import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components';
import { BellButton } from '@/features/notifications/BellButton';
import { HelpdeskList } from '@/features/complaints/HelpdeskList';
import { useAdminNavigation } from '@/lib/useAdminNavigation';
import { useAuthStore } from '@/stores/authStore';

export default function AdminOpsScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const adminNav = useAdminNavigation();

  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-md px-base pb-md pt-3">
        <View className="min-w-0 flex-1 flex-row gap-md">
          <Button
            label={t('nav.screens.dues')}
            variant="tonal"
            icon="credit_card"
            full
            className="flex-1"
            onPress={() => router.push('/(admin)/(ops)/dues')}
          />
          <Button
            label={t('admin.dashboard.gate')}
            variant="tonal"
            icon="qr_code"
            full
            className="flex-1"
            onPress={() => router.push('/(admin)/(ops)/gate')}
          />
        </View>
        <BellButton href={adminNav.href('notifications')} />
      </View>
      <HelpdeskList
        scope="society"
        societyId={societyId}
        onComplaintPress={(id) => adminNav.push('complaints', id)}
      />
    </View>
  );
}
