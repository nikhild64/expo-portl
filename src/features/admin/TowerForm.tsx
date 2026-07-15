import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

export type TowerFormValues = {
  name: string;
  sortOrder?: number;
};

interface Props {
  tower?: Tables<'towers'> | null;
  defaultSortOrder?: number;
  loading?: boolean;
  onSubmit: (values: TowerFormValues) => void;
}

export function TowerForm({ tower, defaultSortOrder, loading, onSubmit }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('validation.selectTower')),
        sortOrder: z.coerce.number().int().min(0).optional(),
      }),
    [t],
  );

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: tower?.name ?? '',
      sortOrder: tower?.sort_order ?? defaultSortOrder ?? 0,
    },
  });

  return (
    <Card className="gap-md">
      <Text variant="headline">{tower ? t('nav.screens.tower') : t('nav.screens.towers')}</Text>
      <Field.Controlled control={control} name="name" label={t('admin.society.towerName')} placeholder={t('admin.society.placeholders.towerName')} />
      <Field.Controlled control={control} name="sortOrder" label={t('admin.society.sortOrder')} keyboardType="number-pad" />
      <Button label={t('admin.society.saveTower')} loading={loading} onPress={handleSubmit((values) => onSubmit(schema.parse(values)))} />
    </Card>
  );
}
