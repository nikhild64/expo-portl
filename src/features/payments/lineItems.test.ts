jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

import { lineItemsToJson, parseLineItems } from './lineItems';

describe('lineItems', () => {
  it('round-trips line items through json', () => {
    const items = [
      { amount: 500, label: 'Maintenance' },
      { amount: 100, label: 'Water' },
    ];
    expect(parseLineItems(lineItemsToJson(items))).toEqual(items);
  });

  it('parses legacy object shapes and ignores invalid rows', () => {
    expect(
      parseLineItems([
        { name: 'Parking', amount: 200 },
        { type: 'Penalty', amount: '50' },
        null,
        'bad',
      ] as never),
    ).toEqual([
      { amount: 200, label: 'Parking' },
      { amount: 50, label: 'Penalty' },
    ]);
  });

  it('returns an empty array for non-array json', () => {
    expect(parseLineItems({} as never)).toEqual([]);
  });
});
