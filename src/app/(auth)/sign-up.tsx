import { useMemo, useState } from 'react';
import { View, Keyboard } from 'react-native';
import { useForm, Controller, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Screen, Text, Field, Button, Checkbox, SegmentedControl } from '@/components';
import { AuthInlinePrompt } from '@/features/auth/AuthInlinePrompt';
import { SignupWizardChrome } from '@/features/auth/SignupWizardChrome';
import { createAuthSchemas, type SignUpInput } from '@/features/auth/schemas';
import { useLocale } from '@/hooks/useLocale';
import { useAuthStore } from '@/stores/authStore';

export default function SignUp() {
  const { t } = useLocale();
  const { signUpSchema } = useMemo(() => createAuthSchemas(t), [t]);
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: {
      accountType: 'resident',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const signUp = useAuthStore((s) => s.signUp);

  const accountType = watch('accountType');
  const fullName = watch('fullName');
  const email = watch('email');
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const onSubmit = handleSubmit(async ({ accountType, fullName, email, password }) => {
    setError(null);
    try {
      await signUp({ email, password, fullName, role: accountType });
      Keyboard.dismiss();
      router.replace('/(auth)/join-society');
      setTimeout(() => useAuthStore.getState().endAuthTransition(), 400);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('auth.signUp.failed');
      setError(msg);
    }
  });

  return (
    <Screen scroll>
      <View className="gap-lg py-xl">
        <SignupWizardChrome step={1} onBack={() => router.back()} />

        <View className="items-center">
          <Text variant="display" color="coral" style={{ fontFamily: 'RobotoFlex-Bold' }}>
            {t('common.appName')}
          </Text>
        </View>

        <View className="gap-xs">
          <Text variant="titleLarge">{t('auth.signUp.createAccount')}</Text>
          <Text variant="body" color="textSecondary">
            {accountType === 'guard'
              ? t('auth.signUp.guardNextStep')
              : t('auth.signUp.residentNextStep')}
          </Text>
        </View>

        <SegmentedControl
          segments={[
            { label: t('auth.signUp.accountTypeResident'), value: 'resident' },
            { label: t('auth.signUp.accountTypeGuard'), value: 'guard' },
          ]}
          value={accountType}
          onChange={(value) => setValue('accountType', value)}
        />

        <View className="gap-base">
          <Field.Controlled
            control={control}
            name="fullName"
            label={t('auth.signUp.fullName')}
            autoCapitalize="words"
            autoComplete="name"
            placeholder={t('auth.placeholders.fullName')}
            valid={fullName.length >= 2 && !errors.fullName}
          />
          <Field.Controlled
            control={control}
            name="email"
            label={t('common.email')}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder={t('auth.placeholders.emailDemo')}
            valid={!errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
          />
          <Field.Controlled
            control={control}
            name="password"
            label={t('common.password')}
            secureTextEntry
            autoComplete="new-password"
            placeholder={t('auth.placeholders.passwordMin')}
            showStrength
            valid={password.length >= 8 && !errors.password}
          />
          <Field.Controlled
            control={control}
            name="confirmPassword"
            label={t('auth.signUp.confirmPassword')}
            secureTextEntry
            autoComplete="new-password"
            placeholder={t('auth.placeholders.repeatPassword')}
            valid={confirmPassword.length >= 8 && confirmPassword === password && !errors.confirmPassword}
          />
        </View>

        <AgreeToTermsField control={control} />

        {error && (
          <Text variant="footnote" color="error">
            {error}
          </Text>
        )}

        <Button
          label={t('common.continue')}
          onPress={onSubmit}
          disabled={isSubmitting}
          full
          icon="arrow_forward"
          iconPosition="right"
        />

        <AuthInlinePrompt
          prompt={t('auth.signUp.alreadyHaveAccount')}
          linkLabel={t('common.signIn')}
          href="/(auth)/sign-in"
        />
      </View>
    </Screen>
  );
}

function AgreeToTermsField({ control }: { control: Control<SignUpInput> }) {
  return (
    <Controller
      control={control}
      name="agreeToTerms"
      render={({ field, fieldState }) => (
        <View className="gap-xs">
          <View className="flex-row items-start gap-md">
            <Checkbox
              checked={field.value}
              onPress={() => field.onChange(!field.value)}
              error={!!fieldState.error}
            />
            <AgreeToTermsLabel />
          </View>
          {fieldState.error && (
            <Text variant="footnote" color="error">
              {fieldState.error.message}
            </Text>
          )}
        </View>
      )}
    />
  );
}

function AgreeToTermsLabel() {
  const { t } = useLocale();
  const terms = t('auth.signUp.termsOfService');
  const privacy = t('auth.signUp.privacyPolicy');
  const template = t('auth.signUp.agreeTerms', { terms: '\0T\0', privacy: '\0P\0' });
  const [head, tail = ''] = template.split('\0T\0');
  const [mid, foot = ''] = tail.split('\0P\0');

  return (
    <Text variant="footnote" color="textSecondary" className="flex-1">
      {head}
      <Text variant="footnote" color="coral" onPress={() => router.push('/(auth)/terms')}>
        {terms}
      </Text>
      {mid}
      <Text variant="footnote" color="coral" onPress={() => router.push('/(auth)/privacy')}>
        {privacy}
      </Text>
      {foot}
    </Text>
  );
}
