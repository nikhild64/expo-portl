import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Link } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button, Field, Screen, Text } from '@/components';
import { createAuthSchemas, type ForgotPasswordInput } from '@/features/auth/schemas';
import { useLocale } from '@/hooks/useLocale';
import { useAuthStore } from '@/stores/authStore';

export default function ForgotPassword() {
  const { t } = useLocale();
  const { forgotPasswordSchema } = useMemo(() => createAuthSchemas(t), [t]);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const sendPasswordResetEmail = useAuthStore((s) => s.sendPasswordResetEmail);

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
      setError(e instanceof Error ? e.message : t('auth.forgotPassword.failed'));
    }
  });

  return (
    <Screen scroll>
      <View className="gap-lg py-xl">
        <View className="gap-xs">
          <Text variant="titleLarge">{t('auth.forgotPassword.title')}</Text>
          <Text variant="body" color="textSecondary">
            {t('auth.forgotPassword.subtitle')}
          </Text>
        </View>

        <Field.Controlled
          control={control}
          name="email"
          label={t('common.email')}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder={t('auth.placeholders.email')}
        />

        {sentTo && (
          <View className="gap-xs rounded-md bg-surface-tertiary p-base">
            <Text variant="subhead">{t('auth.forgotPassword.checkInbox')}</Text>
            <Text variant="footnote" color="textSecondary">
              {t('auth.forgotPassword.sentTo', { email: sentTo })}
            </Text>
          </View>
        )}

        {error && (
          <Text variant="footnote" color="error">
            {error}
          </Text>
        )}

        <Button
          label={t('auth.forgotPassword.sendResetLink')}
          onPress={onSubmit}
          loading={isSubmitting}
          full
        />

        <Link href="/(auth)/sign-in">
          <Text variant="footnote" color="coral" className="text-center">
            {t('auth.forgotPassword.backToSignIn')}
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
