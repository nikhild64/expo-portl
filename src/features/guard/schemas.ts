import type { TFunction } from 'i18next';
import { z } from 'zod';

export const visitorTypeSchema = z.enum(['guest', 'delivery', 'cab', 'service']);

export function createGuardSchemas(t: TFunction) {
  const newEntrySchema = z
    .object({
      company: z.string().optional(),
      flatId: z.string().min(1, t('validation.selectFlat')),
      flatLabel: z.string().optional(),
      purpose: z.string().min(1, t('validation.selectPurpose')),
      serviceType: z.string().optional(),
      type: visitorTypeSchema,
      vehicleNumber: z.string().optional(),
      visitorName: z.string().min(2, t('validation.visitorNameRequired')),
      visitorPhone: z.string().optional(),
      visitorPhotoPath: z.string().optional(),
    })
    .refine((input) => input.type !== 'cab' || !!input.vehicleNumber?.trim(), {
      message: t('validation.vehicleNumberRequired'),
      path: ['vehicleNumber'],
    })
    .refine((input) => input.type !== 'service' || !!input.serviceType?.trim(), {
      message: t('validation.serviceTypeRequired'),
      path: ['serviceType'],
    });

  return { newEntrySchema };
}

export type VisitorType = z.infer<typeof visitorTypeSchema>;
export type NewEntryInput = z.infer<ReturnType<typeof createGuardSchemas>['newEntrySchema']>;

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
    visitorPhotoPath: '',
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

export function titleForType(type: VisitorType, t: TFunction) {
  switch (type) {
    case 'cab':
      return t('guard.add.cab');
    case 'delivery':
      return t('guard.add.delivery');
    case 'service':
      return t('guard.add.service');
    default:
      return t('guard.add.guest');
  }
}
