import { z } from 'zod';

export const preApprovalSchema = z
  .object({
    count: z.string().regex(/^\d+$/, 'Enter a guest count'),
    endAt: z.string().min(1, 'End time required'),
    hasVehicle: z.boolean(),
    notes: z.string().optional(),
    startAt: z.string().min(1, 'Start time required'),
    type: z.enum(['guest', 'delivery', 'cab', 'service']),
    vehiclePlate: z.string().optional(),
    visitorName: z.string().min(2, 'Enter visitor name'),
    visitorPhone: z.string().optional(),
  })
  .refine((input) => !input.hasVehicle || !!input.vehiclePlate?.trim(), {
    message: 'Vehicle plate required',
    path: ['vehiclePlate'],
  });

export type PreApprovalInput = z.infer<typeof preApprovalSchema>;

export function generatePreApprovalCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomBytes = new Uint8Array(6);
  crypto.getRandomValues(randomBytes);
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
