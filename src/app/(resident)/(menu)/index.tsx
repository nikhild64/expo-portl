import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { confirmSignOut } from '@/lib/alert';

import { router, type Href } from 'expo-router';

import { Card, IconSymbol, ListRow, MenuProfileHeader, Screen } from '@/components';
import { useAuthStore } from '@/stores/authStore';

const MENU_ROUTES = [
  { icon: 'notifications' as const, key: 'nav.screens.notifications', href: '/(resident)/(menu)/notifications' },
  { icon: 'construction' as const, key: 'nav.screens.myComplaints', href: '/(resident)/(menu)/complaints' },
  { icon: 'calendar_today' as const, key: 'nav.screens.myBookings', href: '/(resident)/(menu)/amenities' },
  { icon: 'calendar_today' as const, key: 'nav.screens.bookAmenity', href: '/(resident)/(menu)/amenities' },
  { icon: 'directions_car' as const, key: 'nav.screens.vehicles', href: '/(resident)/(menu)/vehicles' },
  { icon: 'groups' as const, key: 'nav.screens.family', href: '/(resident)/(menu)/family' },
  { icon: 'history' as const, key: 'nav.screens.visitorHistory', href: '/(resident)/(menu)/visitor-history' },
  { icon: 'settings' as const, key: 'nav.screens.settings', href: '/(resident)/(menu)/settings' },
] as const satisfies readonly { icon: 'notifications' | 'construction' | 'calendar_today' | 'directions_car' | 'groups' | 'history' | 'settings'; key: string; href: Href }[];

export default function MenuScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const displayName = profile?.full_name ?? t('nav.screens.resident');

  const rows = useMemo(
    () => MENU_ROUTES.map((row) => ({ ...row, title: t(row.key) })),
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
        onPress={() => router.push('/(resident)/(menu)/profile')}
        accessibilityLabel={t('nav.screens.profile')}
      />

      <Card padding="none" className="overflow-hidden">
        {rows.map((row) => (
          <ListRow
            key={row.href}
            left={<IconSymbol name={row.icon} color="coral" />}
            title={row.title}
            onPress={() => router.push(row.href)}
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
