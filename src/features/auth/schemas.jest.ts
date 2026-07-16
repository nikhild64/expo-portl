import { createAuthSchemas } from './schemas';

const t = ((key: string) => key) as any;

describe('createAuthSchemas', () => {
  const schemas = createAuthSchemas(t);

  it('validates sign-in credentials', () => {
    expect(schemas.signInSchema.safeParse({ email: 'bad', password: 'short' }).success).toBe(false);
    expect(
      schemas.signInSchema.safeParse({ email: 'user@portl.demo', password: 'Portl@123' }).success,
    ).toBe(true);
  });

  it('requires matching passwords on sign-up', () => {
    expect(
      schemas.signUpSchema.safeParse({
        accountType: 'resident',
        fullName: 'Alex',
        email: 'user@portl.demo',
        password: 'Portl@123',
        confirmPassword: 'Mismatch1',
        agreeToTerms: true,
      }).success,
    ).toBe(false);
  });

  it('requires terms acceptance on sign-up', () => {
    expect(
      schemas.signUpSchema.safeParse({
        accountType: 'resident',
        fullName: 'Alex',
        email: 'user@portl.demo',
        password: 'Portl@123',
        confirmPassword: 'Portl@123',
        agreeToTerms: false,
      }).success,
    ).toBe(false);
  });

  it('validates join society selections', () => {
    expect(
      schemas.joinSocietySchema.safeParse({
        code: 'AB',
        towerId: 'not-a-uuid',
        flatId: 'not-a-uuid',
        isOwner: false,
        isHead: false,
      }).success,
    ).toBe(false);
  });
});
