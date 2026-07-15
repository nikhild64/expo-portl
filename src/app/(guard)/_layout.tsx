import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { ErrorBoundary, ScreenLoading } from '@/components';
import { nativeTabScreenListeners } from '@/lib/nativeTabScreenListeners';
import { useAuthGuard } from '@/lib/useAuthGuard';

export default function GuardLayout() {
  const { t } = useTranslation();
  const { isReady, isBootstrapping } = useAuthGuard('guard');

  const surface = useCSSVariable('--color-surface') as string;
  const bg = useCSSVariable('--color-bg') as string;
  const coral = useCSSVariable('--color-coral') as string;
  const coralLight = useCSSVariable('--color-coral-light') as string;
  const textSecondary = useCSSVariable('--color-text-secondary') as string;

  if (isBootstrapping || !isReady) return <ScreenLoading variant="tab" />;

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
        <NativeTabs.Trigger name="(home)" disableTransparentOnScrollEdge contentStyle={{ backgroundColor: bg }}>
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
          <NativeTabs.Trigger.Label>{t('nav.tabs.home')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(log)" disableTransparentOnScrollEdge contentStyle={{ backgroundColor: bg }}>
          <NativeTabs.Trigger.Icon sf={{ default: 'list.bullet.rectangle', selected: 'list.bullet.rectangle.fill' }} md="list_alt" />
          <NativeTabs.Trigger.Label>{t('nav.tabs.log')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(menu)" disableTransparentOnScrollEdge contentStyle={{ backgroundColor: bg }}>
          <NativeTabs.Trigger.Icon sf="line.3.horizontal" md="menu" />
          <NativeTabs.Trigger.Label>{t('nav.tabs.menu')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ErrorBoundary>
  );
}
