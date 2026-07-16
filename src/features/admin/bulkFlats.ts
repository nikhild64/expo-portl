import type { TablesInsert } from '@/types/database';

export type BulkFlatValues = {
  floors: number;
  startFloor: number;
  startUnitNumber: number;
  unitBhks: number[];
};

export function buildBulkFlatRows(
  towerId: string,
  values: BulkFlatValues,
  existingNumbers: Set<string>,
): TablesInsert<'flats'>[] {
  const rows: TablesInsert<'flats'>[] = [];

  for (let floorIndex = 0; floorIndex < values.floors; floorIndex += 1) {
    const floor = values.startFloor + floorIndex;

    values.unitBhks.forEach((bhk, unitIndex) => {
      if (bhk <= 0) return;

      const unitNumber = values.startUnitNumber + unitIndex;
      const number = `${floor}${String(unitNumber).padStart(2, '0')}`;

      if (existingNumbers.has(number)) return;

      rows.push({
        bhk,
        floor,
        number,
        tower_id: towerId,
      });
    });
  }

  return rows;
}
