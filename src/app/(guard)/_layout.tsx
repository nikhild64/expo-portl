import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useCSSVariable } from 'uniwind';

import { ErrorBoundary } from '@/components';

export default function GuardLayout() {
  const surface = useCSSVariable('--color-surface') as string;
  const coral = useCSSVariable('--color-coral') as string;
  const coralLight = useCSSVariable('--color-coral-light') as string;
  const textSecondary = useCSSVariable('--color-text-secondary') as string;

  return (
    <ErrorBoundary>
      <NativeTabs
        backgroundColor={surface}
        iconColor={{ default: textSecondary, selected: coral }}
        indicatorColor={coralLight}
        labelStyle={{ selected: { color: coral }, default: { color: textSecondary } }}
        tintColor={coral}
      >
        <NativeTabs.Trigger name="(home)" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger
          name="(add)"
          disableTransparentOnScrollEdge
          contentStyle={{ backgroundColor: coralLight, padding: 6 }}
        >
          <NativeTabs.Trigger.Icon sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} md="add_circle" selectedColor={coral} />
          <NativeTabs.Trigger.Label>Add Visitor</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(log)" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf={{ default: 'list.bullet.rectangle', selected: 'list.bullet.rectangle.fill' }} md="list_alt" />
          <NativeTabs.Trigger.Label>Log</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(menu)" role="more" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf="line.3.horizontal" md="menu" />
          <NativeTabs.Trigger.Label>Menu</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ErrorBoundary>
  );
}
