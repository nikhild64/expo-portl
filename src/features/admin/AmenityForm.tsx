import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, Chip, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

export type AmenityFormValues = {
  active: boolean;
  availableFrom: string;
  availableTo: string;
  capacity?: number;
  coverImageUrl?: string;
  dailyPrice?: number;
  deposit?: number;
  description?: string;
  hourlyPrice?: number;
  name: string;
  rulesText?: string;
};

interface Props {
  amenity?: Tables<'amenities'> | null;
  loading?: boolean;
  onSubmit: (values: AmenityFormValues) => void;
}

export function AmenityForm({ amenity, loading, onSubmit }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        active: z.boolean(),
        availableFrom: z.string().min(1),
        availableTo: z.string().min(1),
        capacity: z.coerce.number().int().min(0).optional(),
        coverImageUrl: z.string().optional(),
        dailyPrice: z.coerce.number().min(0).optional(),
        deposit: z.coerce.number().min(0).optional(),
        description: z.string().optional(),
        hourlyPrice: z.coerce.number().min(0).optional(),
        name: z.string().min(2, t('validation.fullNameRequired')),
        rulesText: z.string().optional(),
      }),
    [t],
  );

  const { control, handleSubmit, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      active: amenity?.active ?? true,
      availableFrom: amenity?.available_from ?? '08:00',
      availableTo: amenity?.available_to ?? '22:00',
      capacity: amenity?.capacity ?? 10,
      coverImageUrl: amenity?.cover_image_url ?? '',
      dailyPrice: amenity?.daily_price ?? 0,
      deposit: amenity?.deposit ?? 0,
      description: amenity?.description ?? '',
      hourlyPrice: amenity?.hourly_price ?? 0,
      name: amenity?.name ?? '',
      rulesText: amenity?.rules_text ?? '',
    },
  });

  return (
    <Card className="gap-md">
      <Text variant="headline">{amenity ? t('nav.screens.amenity') : t('nav.screens.amenities')}</Text>
      <Field.Controlled control={control} name="name" label={t('common.name')} />
      <Field.Controlled control={control} name="description" label={t('common.description')} />
      <Field.Controlled control={control} name="capacity" label={t('admin.community.capacity')} keyboardType="number-pad" />
      <Field.Controlled control={control} name="hourlyPrice" label={t('admin.community.hourlyPrice')} keyboardType="number-pad" />
      <Field.Controlled control={control} name="dailyPrice" label={t('admin.community.dailyPrice')} keyboardType="number-pad" />
      <Field.Controlled control={control} name="deposit" label={t('admin.community.deposit')} keyboardType="number-pad" />
      <Field.Controlled control={control} name="coverImageUrl" label={t('admin.community.coverImageUrl')} autoCapitalize="none" />
      <Field.Controlled control={control} name="availableFrom" label={t('admin.community.availableFrom')} />
      <Field.Controlled control={control} name="availableTo" label={t('admin.community.availableTo')} />
      <Field.Controlled control={control} name="rulesText" label={t('admin.community.rules')} multiline numberOfLines={4} textAlignVertical="top" />
      <View className="flex-row flex-wrap gap-sm">
        <Chip label={t('common.active')} selected={watch('active')} onPress={() => setValue('active', !watch('active'))} />
      </View>
      <Button label={t('admin.community.saveAmenity')} loading={loading} onPress={handleSubmit((values) => onSubmit(schema.parse(values)))} />
    </Card>
  );
}
