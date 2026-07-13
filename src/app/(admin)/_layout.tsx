import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useCSSVariable } from 'uniwind';

import { ErrorBoundary } from '@/components';
import { nativeTabScreenListeners } from '@/lib/nativeTabScreenListeners';
import { useAuthGuard } from '@/lib/useAuthGuard';

export default function AdminLayout() {
  const { isReady } = useAuthGuard('admin');

  const surface = useCSSVariable('--color-surface') as string;
  const coral = useCSSVariable('--color-coral') as string;
  const coralLight = useCSSVariable('--color-coral-light') as string;
  const textSecondary = useCSSVariable('--color-text-secondary') as string;

  if (!isReady) return null;

  return (
    <ErrorBoundary>
      <NativeTabs
        backgroundColor={surface}
        iconColor={{ default: textSecondary, selected: coral }}
        indicatorColor={coralLight}
        labelStyle={{ selected: { color: coral }, default: { color: textSecondary } }}
        screenListeners={nativeTabScreenListeners}
        tintColor={coral}
      >
        <NativeTabs.Trigger name="(dashboard)" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} md="dashboard" />
          <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(society)" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf={{ default: 'building.2', selected: 'building.2.fill' }} md="apartment" />
          <NativeTabs.Trigger.Label>Society</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(community)" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf={{ default: 'megaphone', selected: 'megaphone.fill' }} md="campaign" />
          <NativeTabs.Trigger.Label>Community</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(ops)" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf={{ default: 'wrench.and.screwdriver', selected: 'wrench.and.screwdriver.fill' }} md="build" />
          <NativeTabs.Trigger.Label>Ops</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(menu)" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf="line.3.horizontal" md="menu" />
          <NativeTabs.Trigger.Label>Menu</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ErrorBoundary>
  );
}
