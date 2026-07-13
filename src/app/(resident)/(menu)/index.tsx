import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { alert } from '@/lib/alert';

import { router, type Href } from 'expo-router';

import { Avatar, Card, IconSymbol, ListRow, Screen } from '@/components';
import { useAuthStore } from '@/stores/authStore';

const MENU_ROUTES = [
  { icon: 'notifications' as const, key: 'nav.screens.notifications', href: '/(resident)/(menu)/notifications' },
  { icon: 'person' as const, key: 'nav.screens.profile', href: '/(resident)/(menu)/profile' },
  { icon: 'construction' as const, key: 'nav.screens.myComplaints', href: '/(resident)/(menu)/complaints' },
  { icon: 'calendar_today' as const, key: 'nav.screens.myBookings', href: '/(resident)/(menu)/amenities' },
  { icon: 'calendar_today' as const, key: 'nav.screens.bookAmenity', href: '/(resident)/(menu)/amenities' },
  { icon: 'directions_car' as const, key: 'nav.screens.vehicles', href: '/(resident)/(menu)/vehicles' },
  { icon: 'groups' as const, key: 'nav.screens.family', href: '/(resident)/(menu)/family' },
  { icon: 'history' as const, key: 'nav.screens.visitorHistory', href: '/(resident)/(menu)/visitor-history' },
  { icon: 'settings' as const, key: 'nav.screens.settings', href: '/(resident)/(menu)/settings' },
] as const satisfies ReadonlyArray<{ icon: 'notifications' | 'person' | 'construction' | 'calendar_today' | 'directions_car' | 'groups' | 'history' | 'settings'; key: string; href: Href }>;

export default function MenuScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const rows = useMemo(
    () => MENU_ROUTES.map((row) => ({ ...row, title: t(row.key) })),
    [t],
  );

  const handleSignOut = () => {
    alert(t('alert.titles.signOut'), t('alert.messages.returnSignInScreen'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.signOut'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
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
          left={<Avatar name={profile?.full_name ?? t('nav.screens.resident')} uri={profile?.avatar_url ?? undefined} size="md" />}
          title={t('common.signOut')}
          subtitle={profile?.full_name}
          onPress={handleSignOut}
        />
      </Card>
    </Screen>
  );
}
