import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/EmptyState';
import { useAuthStore } from '@/stores/authStore';

export function BootstrapGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const bootstrapError = useAuthStore((s) => s.bootstrapError);
  const retryBootstrap = useAuthStore((s) => s.retryBootstrap);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

  if (isBootstrapping) return null;

  if (bootstrapError) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-base">
        <EmptyState
          icon="error_outline"
          title={t('common.startupFailed')}
          subtitle={bootstrapError}
          action={{ label: t('common.retry'), onPress: () => void retryBootstrap() }}
        />
      </View>
    );
  }

  return children;
}
