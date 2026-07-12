import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { Card, IconSymbol, Text, type IconName } from '@/components';

const actions: { label: string; subtitle: string; icon: IconName; href: string }[] = [
  { label: 'Pre-approve', subtitle: 'Share QR', icon: 'qr_code', href: '/(resident)/(approvals)/preapprove' },
  { label: 'Book amenity', subtitle: 'Reserve slots', icon: 'calendar_today', href: '/(resident)/(menu)/amenities' },
  { label: 'Raise ticket', subtitle: 'Log complaint', icon: 'construction', href: '/(resident)/(menu)/complaints/new' },
  { label: 'Pay dues', subtitle: 'View balance', icon: 'credit_card', href: '/(resident)/(payments)' },
];

export function QuickActions() {
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
            onPress={() => router.push(action.href as never)}
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
