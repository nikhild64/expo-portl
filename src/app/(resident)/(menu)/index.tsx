import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { confirmSignOut } from '@/lib/alert';
import { useResidentNavigation } from '@/lib/useResidentNavigation';

import { Card, IconSymbol, ListRow, MenuProfileHeader, Screen } from '@/components';
import { useAuthStore } from '@/stores/authStore';

const MENU_ROUTES = [
  { icon: 'notifications' as const, key: 'nav.screens.notifications', navPath: 'notifications' },
  { icon: 'construction' as const, key: 'nav.screens.myComplaints', navPath: 'complaints' },
  { icon: 'calendar_today' as const, key: 'nav.screens.amenities', navPath: 'amenities' },
  { icon: 'credit_card' as const, key: 'nav.screens.payments', navPath: 'payments' },
  { icon: 'directions_car' as const, key: 'nav.screens.vehicles', navPath: 'vehicles' },
  { icon: 'groups' as const, key: 'nav.screens.family', navPath: 'family' },
  { icon: 'history' as const, key: 'nav.screens.visitorHistory', navPath: 'visitor-history' },
  { icon: 'settings' as const, key: 'nav.screens.settings', navPath: 'settings' },
] as const satisfies readonly {
  icon: 'notifications' | 'construction' | 'calendar_today' | 'credit_card' | 'directions_car' | 'groups' | 'history' | 'settings';
  key: string;
  navPath: string;
}[];

export default function MenuScreen() {
  const { t } = useTranslation();
  const residentNav = useResidentNavigation();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const displayName = profile?.full_name ?? t('nav.screens.resident');

  const rows = useMemo(
    () =>
      MENU_ROUTES.map((row) => ({
        key: row.key,
        icon: row.icon,
        title: t(row.key),
        navPath: row.navPath,
      })),
    [t],
  );

  const handleSignOut = () => {
    confirmSignOut(t, signOut, {
      titleKey: 'alert.titles.signOut',
      messageKey: 'alert.messages.returnSignInScreen',
    });
  };

  return (
    <Screen scroll variant="tab">
      <MenuProfileHeader
        name={displayName}
        subtitle={t('nav.screens.resident')}
        avatarUrl={profile?.avatar_url}
        onPress={() => residentNav.push('profile')}
        accessibilityLabel={t('nav.screens.profile')}
      />

      <Card padding="none" className="overflow-hidden">
        {rows.map((row) => (
          <ListRow
            key={row.key}
            left={<IconSymbol name={row.icon} color="coral" />}
            title={row.title}
            onPress={() => residentNav.push(row.navPath)}
          />
        ))}
      </Card>
      <Card padding="none" className="overflow-hidden">
        <ListRow
          left={<IconSymbol name="lock" color="error" />}
          title={t('common.signOut')}
          subtitle={t('alert.messages.returnSignInScreen')}
          onPress={handleSignOut}
        />
      </Card>
    </Screen>
  );
}
