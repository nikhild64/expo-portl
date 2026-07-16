import { toCsv } from './csv';

describe('toCsv', () => {
  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('');
  });

  it('escapes commas, quotes, and null values', () => {
    const csv = toCsv([
      { name: 'Alex', note: 'hello, world' },
      { name: 'Sam "S"', note: null },
    ]);

    expect(csv).toBe('name,note\n"Alex","hello, world"\n"Sam ""S""",""');
  });
});
