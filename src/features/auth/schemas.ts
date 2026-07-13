import type { TFunction } from 'i18next';
import { z } from 'zod';

export function createAuthSchemas(t: TFunction) {
  const signInSchema = z.object({
    email: z.string().email(t('validation.validEmail')),
    password: z.string().min(8, t('validation.minPassword')),
  });

  const forgotPasswordSchema = z.object({
    email: z.string().email(t('validation.validEmail')),
  });

  const resetPasswordSchema = z
    .object({
      password: z.string().min(8, t('validation.minPassword')),
      confirmPassword: z.string().min(8, t('validation.minPassword')),
    })
    .refine((value) => value.password === value.confirmPassword, {
      path: ['confirmPassword'],
      message: t('validation.passwordsMismatch'),
    });

  const signUpSchema = z
    .object({
      accountType: z.enum(['resident', 'guard']),
      fullName: z.string().min(2, t('validation.fullNameRequired')),
      email: z.string().email(t('validation.validEmail')),
      password: z.string().min(8, t('validation.minPassword')),
      confirmPassword: z.string().min(8, t('validation.minPassword')),
      agreeToTerms: z.boolean().refine((v) => v === true, t('validation.agreeTerms')),
    })
    .refine((value) => value.password === value.confirmPassword, {
      path: ['confirmPassword'],
      message: t('validation.passwordsMismatch'),
    });

  const joinSocietySchema = z.object({
    code: z.string().min(4, t('validation.societyCodeRequired')),
    towerId: z.string().uuid(t('validation.selectTower')),
    flatId: z.string().uuid(t('validation.selectFlat')),
    isOwner: z.boolean(),
    isHead: z.boolean(),
  });

  const joinGuardSocietySchema = z.object({
    code: z.string().min(4, t('validation.societyCodeRequired')),
  });

  return {
    signInSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    signUpSchema,
    joinSocietySchema,
    joinGuardSocietySchema,
  };
}

type AuthSchemas = ReturnType<typeof createAuthSchemas>;

export type SignInInput = z.infer<AuthSchemas['signInSchema']>;
export type ForgotPasswordInput = z.infer<AuthSchemas['forgotPasswordSchema']>;
export type ResetPasswordInput = z.infer<AuthSchemas['resetPasswordSchema']>;
export type SignUpInput = z.infer<AuthSchemas['signUpSchema']>;
export type JoinSocietyInput = z.infer<AuthSchemas['joinSocietySchema']>;
export type JoinGuardSocietyInput = z.infer<AuthSchemas['joinGuardSocietySchema']>;
