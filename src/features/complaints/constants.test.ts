import {
  ACTIVE_STATUSES,
  COMPLAINT_CATEGORIES,
  COMPLAINT_CATEGORY_ICONS,
  RESOLVED_STATUSES,
} from './constants';

describe('complaint constants', () => {
  it('defines an icon for every complaint category', () => {
    for (const category of COMPLAINT_CATEGORIES) {
      expect(COMPLAINT_CATEGORY_ICONS[category]).toEqual(expect.any(String));
    }
  });

  it('keeps active and resolved status groups disjoint', () => {
    const overlap = ACTIVE_STATUSES.filter((status) =>
      (RESOLVED_STATUSES as readonly string[]).includes(status),
    );
    expect(overlap).toEqual([]);
  });

  it('includes the expected workflow statuses', () => {
    expect(ACTIVE_STATUSES).toEqual(['new', 'assigned', 'in_progress']);
    expect(RESOLVED_STATUSES).toEqual(['resolved', 'closed']);
  });
});
