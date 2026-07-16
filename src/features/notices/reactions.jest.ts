import { normalizeReactionCounts, normalizeReactionKey } from './reactions';

describe('notice reactions', () => {
  it('normalizes legacy emoji keys', () => {
    expect(normalizeReactionKey('👍')).toBe('thumb_up');
    expect(normalizeReactionKey('favorite')).toBe('favorite');
    expect(normalizeReactionKey('invalid')).toBeNull();
  });

  it('aggregates counts by normalized reaction key', () => {
    expect(
      normalizeReactionCounts({
        '👍': 2,
        thumb_up: 1,
        favorite: 3,
        invalid: 9,
      }),
    ).toEqual({
      thumb_up: 3,
      favorite: 3,
    });
  });

  it('returns an empty object for missing counts', () => {
    expect(normalizeReactionCounts()).toEqual({});
  });
});
