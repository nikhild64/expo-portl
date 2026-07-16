import { buildBulkFlatRows } from './bulkFlats';

describe('buildBulkFlatRows', () => {
  it('generates numbered flats per floor and unit', () => {
    const rows = buildBulkFlatRows(
      'tower-1',
      { floors: 2, startFloor: 1, startUnitNumber: 1, unitBhks: [2, 3] },
      new Set(),
    );

    expect(rows).toEqual([
      { bhk: 2, floor: 1, number: '101', tower_id: 'tower-1' },
      { bhk: 3, floor: 1, number: '102', tower_id: 'tower-1' },
      { bhk: 2, floor: 2, number: '201', tower_id: 'tower-1' },
      { bhk: 3, floor: 2, number: '202', tower_id: 'tower-1' },
    ]);
  });

  it('skips invalid bhks and duplicate flat numbers', () => {
    const rows = buildBulkFlatRows(
      'tower-1',
      { floors: 1, startFloor: 3, startUnitNumber: 4, unitBhks: [0, 2] },
      new Set(['305']),
    );

    expect(rows).toEqual([]);
  });
});
