import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useForm, Controller, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, Link } from 'expo-router';

import { Screen, Text, Field, Button, Checkbox } from '@/components';
import { SignupWizardChrome } from '@/features/auth/SignupWizardChrome';
import { signUpSchema, type SignUpInput } from '@/features/auth/schemas';
import { useAuthStore } from '@/stores/authStore';

const TERMS_URL = 'https://portl.app/terms';
const PRIVACY_URL = 'https://portl.app/privacy';

export default function SignUp() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const signUp = useAuthStore((s) => s.signUp);

  const fullName = watch('fullName');
  const email = watch('email');
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const onSubmit = handleSubmit(async ({ fullName, email, password }) => {
    setError(null);
    try {
      await signUp({ email, password, fullName });
      router.replace('/(auth)/join-society');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign up failed';
      setError(msg);
    }
  });

  return (
    <Screen scroll>
      <View className="gap-lg py-xl">
        <SignupWizardChrome step={1} onBack={() => router.back()} />

        <View className="items-center">
          <Text variant="display" color="coral" style={{ fontFamily: 'RobotoFlex-Bold' }}>
            Portl
          </Text>
        </View>

        <View className="gap-xs">
          <Text variant="titleLarge">Create your account</Text>
          <Text variant="body" color="textSecondary">
            You&apos;ll join your society in the next step
          </Text>
        </View>

        <View className="gap-base">
          <Field.Controlled
            control={control}
            name="fullName"
            label="Full name"
            autoCapitalize="words"
            autoComplete="name"
            placeholder="Rohan Sharma"
            valid={fullName.length >= 2 && !errors.fullName}
          />
          <Field.Controlled
            control={control}
            name="email"
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@portl.demo"
            valid={!errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
          />
          <Field.Controlled
            control={control}
            name="password"
            label="Password"
            secureTextEntry
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            showStrength
            valid={password.length >= 8 && !errors.password}
          />
          <Field.Controlled
            control={control}
            name="confirmPassword"
            label="Confirm password"
            secureTextEntry
            autoComplete="new-password"
            placeholder="Repeat your password"
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
          label="Continue"
          onPress={onSubmit}
          loading={isSubmitting}
          full
          icon="arrow_forward"
          iconPosition="right"
        />

        <View className="flex-row justify-center gap-xs">
          <Text variant="footnote" color="textSecondary">
            Already have an account?
          </Text>
          <Link href="/(auth)/sign-in">
            <Text variant="footnote" color="coral">
              Sign in
            </Text>
          </Link>
        </View>
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
            <Text variant="footnote" color="textSecondary" className="flex-1">
              I agree to{' '}
              <Text variant="footnote" color="coral" onPress={() => Linking.openURL(TERMS_URL)}>
                Portl&apos;s Terms of Service
              </Text>{' '}
              and{' '}
              <Text variant="footnote" color="coral" onPress={() => Linking.openURL(PRIVACY_URL)}>
                Privacy Policy
              </Text>
            </Text>
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
