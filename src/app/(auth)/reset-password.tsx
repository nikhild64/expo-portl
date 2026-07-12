import { useEffect, useState } from 'react';
import { View, useColorScheme } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button, Field, Screen, Text } from '@/components';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/features/auth/schemas';
import { useAuthStore } from '@/stores/authStore';
import { darkColors, lightColors } from '@/theme';

export default function ResetPassword() {
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const url = Linking.useLinkingURL();
  const setRecoverySessionFromUrl = useAuthStore((s) => s.setRecoverySessionFromUrl);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    let cancelled = false;

    async function prepareRecoverySession() {
      setIsPreparing(true);
      setLinkError(null);
      try {
        const initialUrl = url ?? (await Linking.getInitialURL());
        if (initialUrl) {
          await setRecoverySessionFromUrl(initialUrl);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLinkError(e instanceof Error ? e.message : 'Password reset link is invalid or expired');
        }
      } finally {
        if (!cancelled) setIsPreparing(false);
      }
    }

    prepareRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [setRecoverySessionFromUrl, url]);

  const onSubmit = handleSubmit(async ({ password }) => {
    setLinkError(null);
    try {
      await updatePassword(password);
      setIsDone(true);
    } catch (e: unknown) {
      setLinkError(e instanceof Error ? e.message : 'Could not update password');
    }
  });

  return (
    <Screen scroll style={{ backgroundColor: colors.bg }}>
      <View style={{ paddingVertical: 32, gap: 24 }}>
        <View style={{ gap: 8 }}>
          <Text variant="titleLarge">Set new password</Text>
          <Text variant="body" color="textSecondary">
            Choose a new password for your Portl account.
          </Text>
        </View>

        {isDone ? (
          <View style={{ gap: 16 }}>
            <View
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: colors.surfaceTertiary,
                gap: 4,
              }}
            >
              <Text variant="subhead">Password updated</Text>
              <Text variant="footnote" color="textSecondary">
                Sign in again with your new password.
              </Text>
            </View>
            <Button label="Back to sign in" onPress={() => router.replace('/(auth)/sign-in')} full />
          </View>
        ) : (
          <>
            <View style={{ gap: 16 }}>
              <Field.Controlled
                control={control}
                name="password"
                label="New password"
                secureTextEntry
                autoComplete="new-password"
                placeholder="Min. 8 characters"
              />
              <Field.Controlled
                control={control}
                name="confirmPassword"
                label="Confirm password"
                secureTextEntry
                autoComplete="new-password"
                placeholder="Repeat new password"
              />
            </View>

            {linkError && (
              <Text variant="footnote" color="error">
                {linkError}
              </Text>
            )}

            <Button
              label={isPreparing ? 'Preparing link...' : 'Update password'}
              onPress={onSubmit}
              loading={isPreparing || isSubmitting}
              disabled={isPreparing}
              full
            />
          </>
        )}
      </View>
    </Screen>
  );
}
