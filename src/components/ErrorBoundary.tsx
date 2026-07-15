import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { captureException } from '@/lib/sentry';

import { EmptyState } from './EmptyState';

interface State {
  hasError: boolean;
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center bg-bg px-base">
      <EmptyState
        icon="error_outline"
        title={t('common.somethingWentWrong')}
        subtitle={t('common.pleaseTryAgain')}
        action={{ label: t('common.retry'), onPress: onRetry }}
      />
    </View>
  );
}

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('[boundary]', error);
    captureException(error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}
