import { useState } from 'react';
import { View, useColorScheme } from 'react-native';
import { Link } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button, Field, Screen, Text } from '@/components';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/features/auth/schemas';
import { useAuthStore } from '@/stores/authStore';
import { darkColors, lightColors } from '@/theme';

export default function ForgotPassword() {
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const sendPasswordResetEmail = useAuthStore((s) => s.sendPasswordResetEmail);
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    try {
      await sendPasswordResetEmail(email);
      setSentTo(email);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not send reset email');
    }
  });

  return (
    <Screen scroll style={{ backgroundColor: colors.bg }}>
      <View style={{ paddingVertical: 32, gap: 24 }}>
        <View style={{ gap: 8 }}>
          <Text variant="titleLarge">Reset password</Text>
          <Text variant="body" color="textSecondary">
            Enter your email and we&apos;ll send you a link to set a new password.
          </Text>
        </View>

        <Field.Controlled
          control={control}
          name="email"
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="you@example.com"
        />

        {sentTo && (
          <View
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: colors.surfaceTertiary,
              gap: 4,
            }}
          >
            <Text variant="subhead">Check your inbox</Text>
            <Text variant="footnote" color="textSecondary">
              We sent a password reset link to {sentTo}.
            </Text>
          </View>
        )}

        {error && (
          <Text variant="footnote" color="error">
            {error}
          </Text>
        )}

        <Button label="Send reset link" onPress={onSubmit} loading={isSubmitting} full />

        <Link href="/(auth)/sign-in">
          <Text variant="footnote" color="coral" style={{ textAlign: 'center' }}>
            Back to sign in
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
