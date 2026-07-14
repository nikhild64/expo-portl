
import { alertError, alertSuccess, alertWarning } from '@/lib/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, ListRow, Screen, ScreenLoading } from '@/components';
import { BulkFlatForm, FlatForm, type BulkFlatValues, type FlatFormValues } from '@/features/admin/FlatForm';
import { useBulkCreateFlats, useFlats, useUpsertFlat } from '@/queries/useTowers';

export default function AdminTowerFlatsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: flats = [], isLoading } = useFlats(id);
  const upsertFlat = useUpsertFlat();
  const bulkCreate = useBulkCreateFlats();

  if (isLoading) return <ScreenLoading variant="tab" />;

  const createFlat = async (values: FlatFormValues) => {
    try {
      await upsertFlat.mutateAsync({ bhk: values.bhk ?? null, floor: values.floor ?? null, number: values.number, tower_id: id });
      alertSuccess(t('alert.titles.flatSaved'));
    } catch (error) {
      alertError(t('alert.titles.saveFailed'), error);
    }
  };

  const generate = async (values: BulkFlatValues) => {
    const existing = new Set(flats.map((flat) => flat.number));
    const rows = Array.from({ length: values.floors }).flatMap((_, floorIndex) => {
      const floor = floorIndex + 1;
      return Array.from({ length: values.unitsPerFloor }).map((__, unitIndex) => {
        const number = `${floor}${String(unitIndex + 1).padStart(2, '0')}`;
        return { bhk: 2, floor, number, tower_id: id };
      });
    }).filter((flat) => !existing.has(flat.number));

    if (!rows.length) {
      alertWarning(t('alert.titles.nothingToCreate'), t('alert.messages.allFlatsExist'));
      return;
    }

    try {
      await bulkCreate.mutateAsync(rows);
      alertSuccess(t('alert.titles.flatsGenerated'), t('alert.messages.flatsCreated', { count: rows.length }));
    } catch (error) {
      alertError(t('alert.titles.bulkCreateFailed'), error);
    }
  };

  return (
    <Screen scroll variant="tab">
      <FlatForm loading={upsertFlat.isPending} onSubmit={createFlat} />
      <BulkFlatForm loading={bulkCreate.isPending} onSubmit={generate} />
      <Card padding="none" className="overflow-hidden">
        {flats.map((flat) => (
          <ListRow
            key={flat.id}
            title={`${t('nav.screens.flat')} ${flat.number}`}
            subtitle={`${t('admin.society.floor')} ${flat.floor ?? '-'} - ${flat.bhk ?? '-'} ${t('admin.society.bhk')}`}
            showChevron
            onPress={() =>
              router.push({
                pathname: '/(admin)/(society)/towers/[towerId]/flats/[flatId]',
                params: { towerId: id, flatId: flat.id },
              })
            }
          />
        ))}
        {!flats.length && <EmptyState icon="apartment" title={t('admin.society.noFlats')} subtitle={t('admin.society.noFlatsSub')} />}
      </Card>
    </Screen>
  );
}
