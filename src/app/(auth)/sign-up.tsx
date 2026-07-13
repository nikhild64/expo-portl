import { useState } from 'react';
import { View } from 'react-native';
import { useForm, Controller, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, Link } from 'expo-router';

import { Screen, Text, Field, Button, Checkbox } from '@/components';
import { signUpSchema, type SignUpInput } from '@/features/auth/schemas';
import { useAuthStore } from '@/stores/authStore';

export default function SignUp() {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '', agreeToTerms: false },
  });
  const [error, setError] = useState<string | null>(null);
  const signUp = useAuthStore((s) => s.signUp);

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
        <View className="gap-xs">
          <Text variant="titleLarge">Create account</Text>
          <Text variant="body" color="textSecondary">
            Join your society on Portl
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
          />
          <Field.Controlled
            control={control}
            name="email"
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@portl.demo"
          />
          <Field.Controlled
            control={control}
            name="password"
            label="Password"
            secureTextEntry
            autoComplete="new-password"
            placeholder="Min. 8 characters"
          />
        </View>

        <AgreeToTermsField control={control} />

        {error && (
          <Text variant="footnote" color="error">
            {error}
          </Text>
        )}

        <Button
          label="Create account"
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
          <Checkbox
            checked={field.value}
            onPress={() => field.onChange(!field.value)}
            error={!!fieldState.error}
            label="I agree to the Terms of Service and Privacy Policy"
          />
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
