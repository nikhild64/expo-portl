function fieldChanged(next: unknown, prev: unknown): boolean {
  return (next ?? null) !== (prev ?? null);
}

function excludeIds(profileIds: string[], ...exclude: (string | null | undefined)[]): string[] {
  const blocked = new Set(exclude.filter(Boolean));
  return profileIds.filter((id) => !blocked.has(id));
}

describe('push fan-out routing helpers', () => {
  it('treats null and undefined as equal field values', () => {
    expect(fieldChanged(null, undefined)).toBe(false);
    expect(fieldChanged(undefined, null)).toBe(false);
    expect(fieldChanged(null, null)).toBe(false);
  });

  it('detects real field changes', () => {
    expect(fieldChanged('assigned', 'new')).toBe(true);
    expect(fieldChanged(null, 'admin-id')).toBe(true);
  });

  it('excludes complaint creator from admin insert targets', () => {
    const admins = ['admin-1', 'admin-2', 'resident-admin'];
    const raisedBy = 'resident-admin';
    expect(excludeIds(admins, raisedBy)).toEqual(['admin-1', 'admin-2']);
  });

  it('keeps admin targets when creator is a different resident', () => {
    const admins = ['admin-1'];
    expect(excludeIds(admins, 'resident-1')).toEqual(['admin-1']);
  });
});

export { excludeIds, fieldChanged };
