import { Pressable, View } from 'react-native';
import { router, useSegments, type Href } from 'expo-router';

import { Card, IconSymbol, Text, type IconName } from '@/components';
import { residentAmenitiesHref } from '@/lib/residentRoutes';

const actions: { label: string; subtitle: string; icon: IconName; href: (segments: readonly string[]) => Href }[] = [
  { label: 'Pre-approve', subtitle: 'Share QR', icon: 'qr_code', href: () => '/(resident)/(home)/preapprove' as Href },
  { label: 'Book amenity', subtitle: 'Reserve slots', icon: 'calendar_today', href: residentAmenitiesHref },
  { label: 'Raise ticket', subtitle: 'Log complaint', icon: 'construction', href: () => '/(resident)/(home)/complaints/new' as Href },
  { label: 'Pay dues', subtitle: 'View balance', icon: 'credit_card', href: () => '/(resident)/(home)/payments' as Href },
];

export function QuickActions() {
  const segments = useSegments();

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
            onPress={() => router.push(action.href(segments))}
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
