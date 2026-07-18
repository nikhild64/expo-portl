import * as Crypto from 'expo-crypto';
import type { TFunction } from 'i18next';
import { z } from 'zod';

function isValidDateTime(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

export function createPreApprovalSchema(t: TFunction) {
  return z
    .object({
      count: z.string().regex(/^\d+$/, t('validation.guestCountRequired')),
      endAt: z
        .string()
        .min(1, t('validation.endTimeRequired'))
        .refine(isValidDateTime, t('validation.validEndTime')),
      hasVehicle: z.boolean(),
      notes: z.string().optional(),
      startAt: z
        .string()
        .min(1, t('validation.startTimeRequired'))
        .refine(isValidDateTime, t('validation.validStartTime')),
      type: z.enum(['guest', 'delivery', 'cab', 'service']),
      vehiclePlate: z.string().optional(),
      visitorName: z.string().min(2, t('validation.visitorNameRequired')),
      visitorPhone: z.string().optional(),
      recurring: z.boolean(),
    })
    .refine((input) => !input.hasVehicle || !!input.vehiclePlate?.trim(), {
      message: t('validation.vehiclePlateRequired'),
      path: ['vehiclePlate'],
    })
    .refine((input) => new Date(input.endAt) > new Date(input.startAt), {
      message: t('validation.endAfterStart'),
      path: ['endAt'],
    });
}

export type PreApprovalInput = z.infer<ReturnType<typeof createPreApprovalSchema>>;

export function generatePreApprovalCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomBytes = Crypto.getRandomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[randomBytes[i] % chars.length];
  }
  return `PORTL-${code}`;
}

export function defaultPreApprovalValues(): PreApprovalInput {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  const end = new Date(start);
  end.setHours(end.getHours() + 2);

  return {
    count: '1',
    endAt: end.toISOString(),
    hasVehicle: false,
    notes: '',
    startAt: start.toISOString(),
    type: 'guest',
    vehiclePlate: '',
    visitorName: '',
    visitorPhone: '',
    recurring: false,
  };
}
