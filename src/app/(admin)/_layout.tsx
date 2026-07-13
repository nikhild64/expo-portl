import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { ErrorBoundary } from '@/components';
import { nativeTabScreenListeners } from '@/lib/nativeTabScreenListeners';
import { useAuthGuard } from '@/lib/useAuthGuard';

export default function AdminLayout() {
  const { t } = useTranslation();
  const { isReady, isBootstrapping } = useAuthGuard('admin');

  const surface = useCSSVariable('--color-surface') as string;
  const coral = useCSSVariable('--color-coral') as string;
  const coralLight = useCSSVariable('--color-coral-light') as string;
  const textSecondary = useCSSVariable('--color-text-secondary') as string;

  if (isBootstrapping || !isReady) return null;

  return (
    <ErrorBoundary>
      <NativeTabs
        backBehavior="history"
        backgroundColor={surface}
        iconColor={{ default: textSecondary, selected: coral }}
        indicatorColor={coralLight}
        labelStyle={{ selected: { color: coral }, default: { color: textSecondary } }}
        labelVisibilityMode="labeled"
        minimizeBehavior="never"
        screenListeners={nativeTabScreenListeners}
        tintColor={coral}
      >
        <NativeTabs.Trigger name="(dashboard)" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} md="dashboard" />
          <NativeTabs.Trigger.Label>{t('nav.tabs.dashboard')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(society)" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf={{ default: 'building.2', selected: 'building.2.fill' }} md="apartment" />
          <NativeTabs.Trigger.Label>{t('nav.tabs.society')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(community)" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf={{ default: 'megaphone', selected: 'megaphone.fill' }} md="campaign" />
          <NativeTabs.Trigger.Label>{t('nav.tabs.community')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(ops)" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf={{ default: 'wrench.and.screwdriver', selected: 'wrench.and.screwdriver.fill' }} md="build" />
          <NativeTabs.Trigger.Label>{t('nav.tabs.ops')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(menu)" disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf="line.3.horizontal" md="menu" />
          <NativeTabs.Trigger.Label>{t('nav.tabs.menu')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ErrorBoundary>
  );
}
