import { confirmSignOut } from '@/lib/alert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, ListRow, MenuProfileHeader, Screen } from '@/components';
import { useAdminNavigation } from '@/lib/useAdminNavigation';
import { useAuthStore } from '@/stores/authStore';

export default function AdminMenuScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const adminNav = useAdminNavigation();
  const displayName = profile?.full_name ?? 'Admin';

  const handleSignOut = () => {
    confirmSignOut(t, signOut);
  };

  return (
    <Screen scroll variant="tab">
      <MenuProfileHeader
        name={displayName}
        subtitle={t('admin.society.societyAdministrator')}
        avatarUrl={profile?.avatar_url}
        onPress={() => router.push('/(admin)/(menu)/profile')}
        accessibilityLabel={t('nav.screens.profile')}
      />

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
      </Card>
      <Button label={t('admin.menu.signOut')} variant="outlined" onPress={handleSignOut} />
    </Screen>
  );
}
