import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Screen } from '@/components';
import { HelpdeskList } from '@/features/complaints/HelpdeskList';
import { useAdminNavigation } from '@/lib/useAdminNavigation';
import { useAuthStore } from '@/stores/authStore';

export default function AdminOpsScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const adminNav = useAdminNavigation();

  return (
    <Screen variant="tab" safeTop padded={false}>
      <View className="flex-row items-center gap-md px-base pb-md pt-3">
        <Button
          label={t('nav.screens.dues')}
          variant="tonal"
          icon="credit_card"
          full
          className="flex-1"
          onPress={() => router.push('/(admin)/(ops)/dues')}
        />
        <Button
          label={t('nav.screens.visitorHistory')}
          variant="tonal"
          icon="history"
          full
          className="flex-1"
          onPress={() => router.push('/(admin)/(ops)/visitor-history')}
        />
      </View>
      <HelpdeskList
        scope="society"
        societyId={societyId}
        onComplaintPress={(id) => adminNav.push('complaints', id)}
      />
    </Screen>
  );
}
