import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, 'Enter your full name'),
  agreeToTerms: z.boolean().refine((v) => v === true, 'You must agree to the terms'),
});

export const joinSocietySchema = z.object({
  code: z.string().min(4, 'Society code required'),
  towerId: z.string().uuid('Select a tower'),
  flatId: z.string().uuid('Select a flat'),
  isOwner: z.boolean().default(true),
  isHead: z.boolean().default(false),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type JoinSocietyInput = z.infer<typeof joinSocietySchema>;
