import * as Crypto from 'expo-crypto';
import { z } from 'zod';

function isValidDateTime(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

export const preApprovalSchema = z
  .object({
    count: z.string().regex(/^\d+$/, 'Enter a guest count'),
    endAt: z.string().min(1, 'End time required').refine(isValidDateTime, 'Choose a valid end time'),
    hasVehicle: z.boolean(),
    notes: z.string().optional(),
    startAt: z.string().min(1, 'Start time required').refine(isValidDateTime, 'Choose a valid start time'),
    type: z.enum(['guest', 'delivery', 'cab', 'service']),
    vehiclePlate: z.string().optional(),
    visitorName: z.string().min(2, 'Enter visitor name'),
    visitorPhone: z.string().optional(),
  })
  .refine((input) => !input.hasVehicle || !!input.vehiclePlate?.trim(), {
    message: 'Vehicle plate required',
    path: ['vehiclePlate'],
  })
  .refine((input) => new Date(input.endAt) > new Date(input.startAt), {
    message: 'End time must be after start time',
    path: ['endAt'],
  });

export type PreApprovalInput = z.infer<typeof preApprovalSchema>;

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
  };
}
