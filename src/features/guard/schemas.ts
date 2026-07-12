import { z } from 'zod';

export const visitorTypeSchema = z.enum(['guest', 'delivery', 'cab', 'service']);

export const newEntrySchema = z
  .object({
    company: z.string().optional(),
    flatId: z.string().min(1, 'Select a flat'),
    flatLabel: z.string().optional(),
    purpose: z.string().min(1, 'Select a purpose'),
    serviceType: z.string().optional(),
    type: visitorTypeSchema,
    vehicleNumber: z.string().optional(),
    visitorName: z.string().min(2, 'Enter visitor name'),
    visitorPhone: z.string().optional(),
    visitorPhotoUrl: z.string().optional(),
  })
  .refine((input) => input.type !== 'cab' || !!input.vehicleNumber?.trim(), {
    message: 'Vehicle number required',
    path: ['vehicleNumber'],
  })
  .refine((input) => input.type !== 'service' || !!input.serviceType?.trim(), {
    message: 'Service type required',
    path: ['serviceType'],
  });

export type VisitorType = z.infer<typeof visitorTypeSchema>;
export type NewEntryInput = z.infer<typeof newEntrySchema>;

export function defaultNewEntryValues(type: VisitorType): NewEntryInput {
  return {
    company: '',
    flatId: '',
    flatLabel: '',
    purpose: defaultPurposeFor(type),
    serviceType: '',
    type,
    vehicleNumber: '',
    visitorName: '',
    visitorPhone: '',
    visitorPhotoUrl: '',
  };
}

function defaultPurposeFor(type: VisitorType) {
  switch (type) {
    case 'delivery':
      return 'Package';
    case 'cab':
      return 'Pickup';
    case 'service':
      return 'Maintenance';
    default:
      return 'Visit';
  }
}

export function purposesFor(type: VisitorType) {
  switch (type) {
    case 'delivery':
      return ['Package', 'Food', 'Groceries', 'Other'];
    case 'cab':
      return ['Pickup', 'Drop', 'Ride share', 'Other'];
    case 'service':
      return ['Maintenance', 'Repair', 'Housekeeping', 'Other'];
    default:
      return ['Visit', 'Family', 'Meeting', 'Other'];
  }
}

export function titleForType(type: VisitorType) {
  switch (type) {
    case 'cab':
      return 'Cab';
    case 'delivery':
      return 'Delivery';
    case 'service':
      return 'Service';
    default:
      return 'Guest';
  }
}
