import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, IconSymbol, Text, type IconName } from '@/components';
import { useResidentNavigation } from '@/lib/useResidentNavigation';

export function QuickActions() {
  const { t } = useTranslation();
  const residentNav = useResidentNavigation();

  const actions: { label: string; subtitle: string; icon: IconName; path: string }[] = [
    { label: t('resident.home.preapprove'), subtitle: t('resident.home.preapproveSub'), icon: 'qr_code', path: 'preapprove' },
    { label: t('resident.home.bookAmenity'), subtitle: t('resident.home.bookAmenitySub'), icon: 'calendar_today', path: 'amenities' },
    { label: t('resident.home.raiseTicket'), subtitle: t('resident.home.raiseTicketSub'), icon: 'construction', path: 'complaints/new' },
    { label: t('resident.home.payDues'), subtitle: t('resident.home.payDuesSub'), icon: 'credit_card', path: 'payments' },
  ];

  return (
    <View className="gap-md">
      <Text variant="caption" color="textSecondary">
        {t('resident.home.quickActions')}
      </Text>
      <View className="flex-row flex-wrap gap-md">
        {actions.map((action) => (
          <Pressable
            key={action.path}
            className="min-w-[48%] flex-1"
            onPress={() => residentNav.push(action.path)}
            accessibilityRole="button"
            accessibilityLabel={`${action.label}, ${action.subtitle}`}
            android_ripple={{ color: 'rgba(249,112,102,0.15)' }}
          >
            <Card className="gap-sm">
              <IconSymbol name={action.icon} color="coral" />
              <View>
                <Text variant="headline">{action.label}</Text>
                <Text variant="footnote" color="textSecondary">
                  {action.subtitle}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
