import { Pressable, View } from 'react-native';

import { Card, IconSymbol, Text, type IconName } from '@/components';
import { useResidentNavigation } from '@/lib/useResidentNavigation';

const actions: { label: string; subtitle: string; icon: IconName; path: string }[] = [
  { label: 'Pre-approve', subtitle: 'Share QR', icon: 'qr_code', path: 'preapprove' },
  { label: 'Book amenity', subtitle: 'Reserve slots', icon: 'calendar_today', path: 'amenities' },
  { label: 'Raise ticket', subtitle: 'Log complaint', icon: 'construction', path: 'complaints/new' },
  { label: 'Pay dues', subtitle: 'View balance', icon: 'credit_card', path: 'payments' },
];
export function QuickActions() {
  const residentNav = useResidentNavigation();

  return (
    <View className="gap-md">
      <Text variant="caption" color="textSecondary">
        QUICK ACTIONS
      </Text>
      <View className="flex-row flex-wrap gap-md">
        {actions.map((action) => (
          <Pressable
            key={action.label}
            className="w-[47%]"
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
