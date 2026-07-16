import {
  createGuardSchemas,
  defaultNewEntryValues,
  purposesFor,
  titleForType,
  visitorTypeSchema,
} from './schemas';

const t = ((key: string) => key) as any;

describe('guard schemas', () => {
  it('accepts valid guest entries', () => {
    const { newEntrySchema } = createGuardSchemas(t);

    expect(
      newEntrySchema.safeParse({
        ...defaultNewEntryValues('guest'),
        flatId: 'flat-1',
        visitorName: 'Alex',
      }).success,
    ).toBe(true);
  });

  it('requires vehicle number for cab visitors', () => {
    const { newEntrySchema } = createGuardSchemas(t);
    const result = newEntrySchema.safeParse({
      ...defaultNewEntryValues('cab'),
      flatId: 'flat-1',
      visitorName: 'Alex',
      vehicleNumber: '',
    });

    expect(result.success).toBe(false);
  });

  it('requires service type for service visitors', () => {
    const { newEntrySchema } = createGuardSchemas(t);
    const result = newEntrySchema.safeParse({
      ...defaultNewEntryValues('service'),
      flatId: 'flat-1',
      visitorName: 'Alex',
      serviceType: '',
    });

    expect(result.success).toBe(false);
  });

  it('provides default values and purpose lists per visitor type', () => {
    expect(defaultNewEntryValues('delivery').purpose).toBe('Package');
    expect(defaultNewEntryValues('cab').purpose).toBe('Pickup');
    expect(purposesFor('guest')).toContain('Visit');
    expect(titleForType('delivery', t)).toBe('guard.add.delivery');
    expect(visitorTypeSchema.options).toEqual(['guest', 'delivery', 'cab', 'service']);
  });
});
