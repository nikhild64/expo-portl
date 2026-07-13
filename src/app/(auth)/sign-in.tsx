import { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, Text, Field, Button, IconSymbol } from '@/components';
import { createAuthSchemas, type SignInInput } from '@/features/auth/schemas';
import { useLocale } from '@/hooks/useLocale';
import { useAuthStore } from '@/stores/authStore';

export default function SignIn() {
  const { t } = useLocale();
  const { signInSchema } = useMemo(() => createAuthSchemas(t), [t]);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });
  const [error, setError] = useState<string | null>(null);
  const signIn = useAuthStore((s) => s.signIn);
  const insets = useSafeAreaInsets();

  const onSubmit = handleSubmit(async (input) => {
    setError(null);
    try {
      await signIn(input);
      router.replace('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('auth.signIn.failed');
      setError(msg);
    }
  });

  return (
    <Screen scroll>
      {router.canGoBack() && (
        <Pressable
          onPress={() => router.back()}
          className="mb-xs h-10 w-10 items-center justify-center self-start rounded-pill border border-border bg-surface-tertiary"
          style={{ marginTop: insets.top > 0 ? 0 : 8 }}
          hitSlop={8}
        >
          <IconSymbol name="arrow_back" size={20} color="textPrimary" />
        </Pressable>
      )}

      <View style={{ paddingBottom: 32, gap: 0 }}>
        <View className="my-xl items-center gap-sm">
          <View className="h-[60px] w-[60px] items-center justify-center rounded-lg border border-border bg-surface-tertiary">
            <IconSymbol name="apartment" size={32} color="coral" />
          </View>
          <Text variant="headline" color="coral">
            {t('common.appName')}
          </Text>
        </View>

        <View className="mb-xl items-center gap-xs">
          <Text variant="titleLarge" className="text-center">
            {t('auth.signIn.welcomeBack')}
          </Text>
          <Text variant="body" color="textSecondary" className="text-center">
            {t('auth.signIn.subtitle')}
          </Text>
        </View>

        <View className="mb-xs gap-base">
          <Field.Controlled
            control={control}
            name="email"
            label={t('common.email')}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder={t('auth.placeholders.email')}
          />
          <Field.Controlled
            control={control}
            name="password"
            label={t('common.password')}
            secureTextEntry
            autoComplete="current-password"
            placeholder={t('auth.placeholders.password')}
          />
        </View>

        <View className="mb-lg items-end">
          <Link href="/(auth)/forgot-password">
            <Text variant="footnote" color="coral">
              {t('auth.signIn.forgotPassword')}
            </Text>
          </Link>
        </View>

        {error && (
          <Text variant="footnote" color="error" className="mb-md">
            {error}
          </Text>
        )}

        <Button
          label={t('common.signIn')}
          onPress={onSubmit}
          loading={isSubmitting}
          full
          icon="arrow_forward"
          iconPosition="right"
        />

        <View className="my-lg flex-row items-center gap-md">
          <View className="h-px flex-1 bg-border" />
          <Text variant="footnote" color="textTertiary">
            {t('common.or')}
          </Text>
          <View className="h-px flex-1 bg-border" />
        </View>

        <View className="flex-row justify-center gap-xs">
          <Text variant="footnote" color="textSecondary">
            {t('auth.signIn.newToPortl')}
          </Text>
          <Link href="/(auth)/sign-up">
            <Text variant="footnote" color="coral">
              {t('auth.signIn.joinSociety')}
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
