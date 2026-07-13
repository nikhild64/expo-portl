import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button, Field, Screen, Text } from '@/components';
import { createAuthSchemas, type ResetPasswordInput } from '@/features/auth/schemas';
import { useLocale } from '@/hooks/useLocale';
import { useAuthStore } from '@/stores/authStore';

export default function ResetPassword() {
  const { t } = useLocale();
  const { resetPasswordSchema } = useMemo(() => createAuthSchemas(t), [t]);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const url = Linking.useLinkingURL();
  const setRecoverySessionFromUrl = useAuthStore((s) => s.setRecoverySessionFromUrl);
  const updatePassword = useAuthStore((s) => s.updatePassword);

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
          setLinkError(e instanceof Error ? e.message : t('auth.resetPassword.linkInvalid'));
        }
      } finally {
        if (!cancelled) setIsPreparing(false);
      }
    }

    prepareRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [setRecoverySessionFromUrl, t, url]);

  const onSubmit = handleSubmit(async ({ password }) => {
    setLinkError(null);
    try {
      await updatePassword(password);
      setIsDone(true);
    } catch (e: unknown) {
      setLinkError(e instanceof Error ? e.message : t('auth.resetPassword.updateFailed'));
    }
  });

  return (
    <Screen scroll>
      <View className="gap-lg py-xl">
        <View className="gap-xs">
          <Text variant="titleLarge">{t('auth.resetPassword.title')}</Text>
          <Text variant="body" color="textSecondary">
            {t('auth.resetPassword.subtitle')}
          </Text>
        </View>

        {isDone ? (
          <View className="gap-base">
            <View className="gap-xs rounded-md bg-surface-tertiary p-base">
              <Text variant="subhead">{t('auth.resetPassword.updated')}</Text>
              <Text variant="footnote" color="textSecondary">
                {t('auth.resetPassword.signInAgain')}
              </Text>
            </View>
            <Button
              label={t('auth.forgotPassword.backToSignIn')}
              onPress={() => router.replace('/(auth)/sign-in')}
              full
            />
          </View>
        ) : (
          <>
            <View className="gap-base">
              <Field.Controlled
                control={control}
                name="password"
                label={t('auth.resetPassword.newPassword')}
                secureTextEntry
                autoComplete="new-password"
                placeholder={t('auth.placeholders.passwordMin')}
              />
              <Field.Controlled
                control={control}
                name="confirmPassword"
                label={t('auth.resetPassword.confirmPassword')}
                secureTextEntry
                autoComplete="new-password"
                placeholder={t('auth.placeholders.repeatNewPassword')}
              />
            </View>

            {linkError && (
              <Text variant="footnote" color="error">
                {linkError}
              </Text>
            )}

            <Button
              label={isPreparing ? t('auth.resetPassword.preparingLink') : t('auth.resetPassword.updatePassword')}
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
