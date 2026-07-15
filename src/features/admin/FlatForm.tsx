import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, Field, NumberStepper, Text } from '@/components';
import type { BulkFlatValues } from '@/features/admin/bulkFlats';
import type { Tables } from '@/types/database';

export type { BulkFlatValues };

export type FlatFormValues = {
  bhk?: number;
  floor?: number;
  number: string;
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
        floors: z.number().int().min(1),
        startFloor: z.number().int().min(1),
        startUnitNumber: z.number().int().min(1).max(99),
        unitBhks: z.array(z.number().int().min(1)).min(1),
      }),
    [],
  );

  const { control, handleSubmit, setValue, watch } = useForm<BulkFlatValues>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      floors: 20,
      startFloor: 1,
      startUnitNumber: 1,
      unitBhks: [2, 4, 4, 5],
    },
  });

  const unitBhks = watch('unitBhks');

  const updateUnitBhk = (index: number, bhk: number) => {
    const next = [...unitBhks];
    next[index] = bhk;
    setValue('unitBhks', next, { shouldValidate: true });
  };

  const addUnit = () => {
    setValue('unitBhks', [...unitBhks, 2], { shouldValidate: true });
  };

  const removeUnit = () => {
    if (unitBhks.length <= 1) return;
    setValue('unitBhks', unitBhks.slice(0, -1), { shouldValidate: true });
  };

  return (
    <Card className="gap-md">
      <Text variant="headline">{t('admin.society.bulkGenerateFlats')}</Text>
      <Text variant="footnote" color="textSecondary">
        {t('admin.society.bulkGenerateNote')}
      </Text>

      <Controller
        control={control}
        name="floors"
        render={({ field }) => <NumberStepper label={t('admin.society.floors')} value={field.value} min={1} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="startFloor"
        render={({ field }) => <NumberStepper label={t('admin.society.startFloor')} value={field.value} min={1} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="startUnitNumber"
        render={({ field }) => (
          <NumberStepper label={t('admin.society.startUnitNumber')} value={field.value} min={1} max={99} onChange={field.onChange} />
        )}
      />

      <View className="gap-sm">
        <Text variant="footnote" color="textSecondary">
          {t('admin.society.unitsPerFloorTemplate')}
        </Text>
        {unitBhks.map((bhk, index) => (
          <NumberStepper
            key={`unit-bhk-${index}`}
            label={t('admin.society.unitBhkLabel', { unit: index + 1 })}
            value={bhk}
            min={1}
            onChange={(next) => updateUnitBhk(index, next)}
          />
        ))}
        <View className="flex-row gap-sm">
          <Button label={t('admin.society.addUnit')} variant="outlined" icon="add" onPress={addUnit} className="flex-1" />
          <Button
            label={t('admin.society.removeUnit')}
            variant="outlined"
            icon="remove"
            disabled={unitBhks.length <= 1}
            onPress={removeUnit}
            className="flex-1"
          />
        </View>
      </View>

      <Button
        label={t('admin.society.generateFlats')}
        variant="tonal"
        loading={loading}
        onPress={handleSubmit((values) => onSubmit(bulkSchema.parse(values)))}
      />
    </Card>
  );
}
