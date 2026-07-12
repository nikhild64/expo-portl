import { useState } from 'react';
import { View, Pressable, useColorScheme } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, Text, Field, Button, IconSymbol } from '@/components';
import { signInSchema, type SignInInput } from '@/features/auth/schemas';
import { useAuthStore } from '@/stores/authStore';
import { darkColors, lightColors } from '@/theme';

export default function SignIn() {
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const dividerColor = colors.border;
  const logoBg = colors.surfaceTertiary;

  const onSubmit = handleSubmit(async (input) => {
    setError(null);
    try {
      await signIn(input);
      router.replace('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign in failed';
      setError(msg);
    }
  });

  return (
    <Screen scroll style={{ backgroundColor: colors.bg }}>
      {/* Back button */}
      {router.canGoBack() && (
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: insets.top > 0 ? 0 : 8,
            marginBottom: 8,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: logoBg,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-start',
          }}
          hitSlop={8}
        >
          <IconSymbol name="arrow_back" size={20} color="textPrimary" />
        </Pressable>
      )}

      <View style={{ paddingBottom: 32, gap: 0 }}>
        {/* Portl logo */}
        <View style={{ alignItems: 'center', marginVertical: 32, gap: 10 }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              backgroundColor: logoBg,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconSymbol name="apartment" size={32} color="coral" />
          </View>
          <Text variant="headline" color="coral">
            Portl
          </Text>
        </View>

        {/* Heading */}
        <View style={{ gap: 6, alignItems: 'center', marginBottom: 32 }}>
          <Text variant="titleLarge" style={{ textAlign: 'center' }}>
            Welcome back
          </Text>
          <Text variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
            Sign in to your society
          </Text>
        </View>

        {/* Form fields */}
        <View style={{ gap: 16, marginBottom: 8 }}>
          <Field.Controlled
            control={control}
            name="email"
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Field.Controlled
            control={control}
            name="password"
            label="Password"
            secureTextEntry
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </View>

        {/* Forgot password — right aligned */}
        <View style={{ alignItems: 'flex-end', marginBottom: 24 }}>
          <Text variant="footnote" color="coral">
            Forgot password?
          </Text>
        </View>

        {/* Error */}
        {error && (
          <Text variant="footnote" color="error" style={{ marginBottom: 12 }}>
            {error}
          </Text>
        )}

        {/* Sign in button */}
        <Button
          label="Sign in"
          onPress={onSubmit}
          loading={isSubmitting}
          full
          icon="arrow_forward"
          iconPosition="right"
        />

        {/* Divider */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginVertical: 24,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
          <Text variant="footnote" color="textTertiary">
            or
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
        </View>

        {/* Sign up link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
          <Text variant="footnote" color="textSecondary">
            New to Portl?
          </Text>
          <Link href="/(auth)/sign-up">
            <Text variant="footnote" color="coral">
              Join your society
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
