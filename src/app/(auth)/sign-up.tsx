import { useState } from 'react';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, Link } from 'expo-router';

import { Screen, Text, Field, Button } from '@/components';
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
      <View style={{ paddingVertical: 32, gap: 24 }}>
        <View style={{ gap: 8 }}>
          <Text variant="titleLarge">Create account</Text>
          <Text variant="body" color="textSecondary">
            Join your society on Portl
          </Text>
        </View>

        <View style={{ gap: 16 }}>
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

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
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

import { Controller, type Control } from 'react-hook-form';
import { Pressable } from 'react-native';

function AgreeToTermsField({ control }: { control: Control<SignUpInput> }) {
  return (
    <Controller
      control={control}
      name="agreeToTerms"
      render={({ field, fieldState }) => (
        <View style={{ gap: 4 }}>
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            onPress={() => field.onChange(!field.value)}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: fieldState.error ? '#EF4444' : field.value ? '#F97066' : '#D1C4BE',
                backgroundColor: field.value ? '#F97066' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {field.value && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
            </View>
            <Text variant="footnote" color="textSecondary" style={{ flex: 1 }}>
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </Pressable>
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
