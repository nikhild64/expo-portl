import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, ListRow, Screen, Text } from '@/components';
import { useAdminNavigation } from '@/lib/useAdminNavigation';
import { useAuthStore } from '@/stores/authStore';

export default function AdminMenuScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const adminNav = useAdminNavigation();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="gap-sm">
        <Text variant="title">{profile?.full_name ?? 'Admin'}</Text>
        <Text variant="body" color="textSecondary">
          {t('admin.society.societyAdministrator')}
        </Text>
      </Card>
      <Card padding="none" className="overflow-hidden">
        <ListRow
          title={t('nav.screens.notifications')}
          subtitle={t('notifications.channels.complaintsDesc')}
          showChevron
          onPress={() => adminNav.push('notifications')}
        />
        <ListRow
          title={t('nav.screens.societySettings')}
          subtitle={t('admin.society.societySettings')}
          showChevron
          onPress={() => router.push('/(admin)/(menu)/society-settings')}
        />
        <ListRow
          title={t('nav.screens.profile')}
          subtitle={t('common.name')}
          showChevron
          onPress={() => router.push('/(admin)/(menu)/profile')}
        />
      </Card>
      <Button label={t('admin.menu.signOut')} variant="outlined" onPress={handleSignOut} />
    </Screen>
  );
}
