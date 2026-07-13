import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { IconSymbol, Text } from '@/components';

const STEP_LABELS = {
  1: 'Account',
  2: 'Join society',
} as const;

interface Props {
  step: 1 | 2;
  onBack?: () => void;
  children?: ReactNode;
}

export function SignupWizardChrome({ step, onBack, children }: Props) {
  const handleBack = onBack ?? (() => router.back());

  return (
    <View className="gap-lg">
      <Pressable
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="h-10 w-10 items-center justify-center self-start rounded-pill border border-border bg-surface-tertiary"
        hitSlop={8}
      >
        <IconSymbol name="arrow_back" size={20} color="textPrimary" />
      </Pressable>

      <View className="gap-sm">
        <View className="flex-row gap-xs">
          <View className={`h-1 flex-1 rounded-pill ${step >= 1 ? 'bg-coral' : 'bg-border'}`} />
          <View className={`h-1 flex-1 rounded-pill ${step >= 2 ? 'bg-coral' : 'bg-border'}`} />
        </View>
        <Text variant="footnote" color="textSecondary">
          {`Step ${step} of 2 — ${STEP_LABELS[step]}`}
        </Text>
      </View>

      {children}
    </View>
  );
}
