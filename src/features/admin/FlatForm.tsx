import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

export type FlatFormValues = {
  bhk?: number;
  floor?: number;
  number: string;
};

export type BulkFlatValues = {
  floors: number;
  unitsPerFloor: number;
};

interface FlatFormProps {
  flat?: Tables<'flats'> | null;
  loading?: boolean;
  onSubmit: (values: FlatFormValues) => void;
}

interface BulkFormProps {
  loading?: boolean;
  onSubmit: (values: BulkFlatValues) => void;
}

export function FlatForm({ flat, loading, onSubmit }: FlatFormProps) {
  const { t } = useTranslation();
  const flatSchema = useMemo(
    () =>
      z.object({
        bhk: z.coerce.number().int().min(0).optional(),
        floor: z.coerce.number().int().min(0).optional(),
        number: z.string().min(1, t('validation.selectFlat')),
      }),
    [t],
  );

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(flatSchema),
    defaultValues: {
      bhk: flat?.bhk ?? 2,
      floor: flat?.floor ?? 1,
      number: flat?.number ?? '',
    },
  });

  return (
    <Card className="gap-md">
      <Text variant="headline">{flat ? t('nav.screens.flat') : t('nav.screens.flats')}</Text>
      <Field.Controlled control={control} name="number" label={t('admin.society.flatNumber')} placeholder={t('admin.society.placeholders.flatNumber')} />
      <Field.Controlled control={control} name="floor" label={t('admin.society.floor')} keyboardType="number-pad" />
      <Field.Controlled control={control} name="bhk" label={t('admin.society.bhk')} keyboardType="number-pad" />
      <Button label={t('admin.society.saveFlat')} loading={loading} onPress={handleSubmit((values) => onSubmit(flatSchema.parse(values)))} />
    </Card>
  );
}

export function BulkFlatForm({ loading, onSubmit }: BulkFormProps) {
  const { t } = useTranslation();
  const bulkSchema = useMemo(
    () =>
      z.object({
        floors: z.coerce.number().int().min(1),
        unitsPerFloor: z.coerce.number().int().min(1),
      }),
    [t],
  );

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(bulkSchema),
    defaultValues: { floors: 20, unitsPerFloor: 4 },
  });

  return (
    <Card className="gap-md">
      <Text variant="headline">{t('admin.society.bulkGenerateFlats')}</Text>
      <Text variant="footnote" color="textSecondary">
        {t('admin.society.bulkGenerateNote')}
      </Text>
      <Field.Controlled control={control} name="floors" label={t('admin.society.floors')} keyboardType="number-pad" />
      <Field.Controlled control={control} name="unitsPerFloor" label={t('admin.society.unitsPerFloor')} keyboardType="number-pad" />
      <Button label={t('admin.society.generateFlats')} variant="tonal" loading={loading} onPress={handleSubmit((values) => onSubmit(bulkSchema.parse(values)))} />
    </Card>
  );
}
