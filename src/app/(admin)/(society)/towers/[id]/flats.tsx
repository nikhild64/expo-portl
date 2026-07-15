
import { useMemo, useState } from 'react';
import { alertError, alertSuccess, alertWarning } from '@/lib/alert';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, EmptyState, Field, ListRow, Screen, ScreenLoading } from '@/components';
import { buildBulkFlatRows } from '@/features/admin/bulkFlats';
import { BulkFlatForm, FlatForm, type BulkFlatValues, type FlatFormValues } from '@/features/admin/FlatForm';
import { useBulkCreateFlats, useFlats, useUpsertFlat } from '@/queries/useTowers';

export default function AdminTowerFlatsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: flats = [], isLoading } = useFlats(id);
  const upsertFlat = useUpsertFlat();
  const bulkCreate = useBulkCreateFlats();
  const [search, setSearch] = useState('');

  const filteredFlats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return flats;

    return flats.filter((flat) => {
      const number = flat.number.toLowerCase();
      const floor = String(flat.floor ?? '');
      const bhk = String(flat.bhk ?? '');
      return number.includes(query) || floor.includes(query) || bhk.includes(query);
    });
  }, [flats, search]);

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
    const rows = buildBulkFlatRows(id, values, existing);

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
      <Field
        value={search}
        onChangeText={setSearch}
        placeholder={t('admin.society.searchFlats')}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Card padding="none" className="overflow-hidden">
        {filteredFlats.map((flat) => (
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
        {!filteredFlats.length && (
          <EmptyState
            icon="apartment"
            title={search.trim() ? t('admin.society.noFlatsMatch') : t('admin.society.noFlats')}
            subtitle={search.trim() ? t('admin.society.noFlatsMatchSub') : t('admin.society.noFlatsSub')}
          />
        )}
      </Card>
    </Screen>
  );
}
