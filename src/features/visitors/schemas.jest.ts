jest.mock('expo-crypto', () => ({
  getRandomBytes: jest.fn(() => Uint8Array.from([0, 1, 2, 3, 4, 5])),
}));

import * as Crypto from 'expo-crypto';

import {
  createPreApprovalSchema,
  defaultPreApprovalValues,
  generatePreApprovalCode,
} from './schemas';

const t = ((key: string) => key) as any;

describe('createPreApprovalSchema', () => {
  const schema = createPreApprovalSchema(t);

  const validInput = {
    count: '2',
    endAt: '2026-07-16T18:00:00.000Z',
    hasVehicle: false,
    notes: 'Leave at gate',
    startAt: '2026-07-16T09:00:00.000Z',
    type: 'guest' as const,
    vehiclePlate: '',
    visitorName: 'Alex Guest',
    visitorPhone: '9876543210',
  };

  it('accepts valid pre-approval input', () => {
    expect(schema.safeParse(validInput).success).toBe(true);
  });

  it('requires a visitor name with at least two characters', () => {
    expect(schema.safeParse({ ...validInput, visitorName: 'A' }).success).toBe(false);
  });

  it('requires a numeric guest count', () => {
    expect(schema.safeParse({ ...validInput, count: 'abc' }).success).toBe(false);
  });

  it('requires a vehicle plate when hasVehicle is true', () => {
    expect(schema.safeParse({ ...validInput, hasVehicle: true, vehiclePlate: '   ' }).success).toBe(
      false,
    );
  });

  it('requires end time after start time', () => {
    expect(
      schema.safeParse({
        ...validInput,
        startAt: '2026-07-16T18:00:00.000Z',
        endAt: '2026-07-16T09:00:00.000Z',
      }).success,
    ).toBe(false);
  });
});

describe('generatePreApprovalCode', () => {
  it('builds a PORTL-prefixed code from random bytes', () => {
    expect(generatePreApprovalCode()).toBe('PORTL-ABCDEF');
    expect(Crypto.getRandomBytes).toHaveBeenCalledWith(6);
  });
});

describe('defaultPreApprovalValues', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-16T10:30:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('defaults to one guest starting next hour for two hours', () => {
    const values = defaultPreApprovalValues();
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    const end = new Date(start);
    end.setHours(end.getHours() + 2);

    expect(values.count).toBe('1');
    expect(values.type).toBe('guest');
    expect(values.hasVehicle).toBe(false);
    expect(values.visitorName).toBe('');
    expect(values.startAt).toBe(start.toISOString());
    expect(values.endAt).toBe(end.toISOString());
  });
});
