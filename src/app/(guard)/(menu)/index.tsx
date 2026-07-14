import { alert, confirmSignOut } from '@/lib/alert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, IconSymbol, ListRow, MenuProfileHeader, Screen } from '@/components';
import { useGuardNavigation } from '@/lib/useGuardNavigation';
import { useAuthStore } from '@/stores/authStore';

export default function GuardMenuScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const guardNav = useGuardNavigation();
  const displayName = profile?.full_name ?? t('nav.screens.guard');

  const handleSignOut = () => {
    confirmSignOut(t, signOut);
  };

  return (
    <Screen scroll variant="tab">
      <MenuProfileHeader
        name={displayName}
        subtitle={t('nav.screens.guard')}
        avatarUrl={profile?.avatar_url}
        onPress={() => router.push('/(guard)/(menu)/profile')}
        accessibilityLabel={t('nav.screens.profile')}
      />

      <Card padding="none" className="overflow-hidden">
        <ListRow
          title={t('nav.screens.notifications')}
          subtitle={t('notifications.channels.visitorApprovalsDesc')}
          left={<IconSymbol name="notifications" color="coral" />}
          onPress={() => guardNav.push('notifications')}
        />
        <ListRow
          title={t('guard.alerts.shiftInfo')}
          subtitle={t('guard.alerts.shiftInfoMsg')}
          left={<IconSymbol name="schedule" color="coral" />}
          onPress={() => alert(t('alert.titles.shiftInfo'), t('alert.messages.currentShift'))}
        />
        <ListRow
          title={t('nav.screens.raiseAlert')}
          subtitle={t('guard.alerts.urgentNote')}
          left={<IconSymbol name="warning_amber" color="warning" />}
          onPress={() => router.push('/(guard)/(menu)/alerts')}
        />
        <ListRow
          title={t('nav.screens.settings')}
          subtitle={t('settings.notifications')}
          left={<IconSymbol name="settings" color="coral" />}
          onPress={() => guardNav.push('settings')}
        />
      </Card>

      <Card padding="none" className="overflow-hidden">
        <ListRow
          title={t('common.signOut')}
          subtitle={t('guard.menu.signOutMsg')}
          left={<IconSymbol name="lock" color="error" />}
          onPress={handleSignOut}
        />
      </Card>
    </Screen>
  );
}
