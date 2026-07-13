import { Component, type PropsWithChildren } from 'react';
import { View } from 'react-native';

import { EmptyState } from './EmptyState';

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[boundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-bg px-base">
          <EmptyState
            icon="error_outline"
            title="Something went wrong"
            subtitle="Please try again."
            action={{ label: 'Retry', onPress: () => this.setState({ hasError: false }) }}
          />
        </View>
      );
    }

    return this.props.children;
  }
}
