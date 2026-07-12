import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Card, Chip, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

const schema = z.object({
  active: z.boolean(),
  availableFrom: z.string().min(1),
  availableTo: z.string().min(1),
  capacity: z.coerce.number().int().min(0).optional(),
  coverImageUrl: z.string().optional(),
  dailyPrice: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  hourlyPrice: z.coerce.number().min(0).optional(),
  name: z.string().min(2, 'Name is required'),
  rulesText: z.string().optional(),
});

export type AmenityFormValues = z.output<typeof schema>;

interface Props {
  amenity?: Tables<'amenities'> | null;
  loading?: boolean;
  onSubmit: (values: AmenityFormValues) => void;
}

export function AmenityForm({ amenity, loading, onSubmit }: Props) {
  const { control, handleSubmit, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      active: amenity?.active ?? true,
      availableFrom: amenity?.available_from ?? '08:00',
      availableTo: amenity?.available_to ?? '22:00',
      capacity: amenity?.capacity ?? 10,
      coverImageUrl: amenity?.cover_image_url ?? '',
      dailyPrice: amenity?.daily_price ?? 0,
      description: amenity?.description ?? '',
      hourlyPrice: amenity?.hourly_price ?? 0,
      name: amenity?.name ?? '',
      rulesText: amenity?.rules_text ?? '',
    },
  });

  return (
    <Card className="gap-md">
      <Text variant="headline">{amenity ? 'Edit amenity' : 'Add amenity'}</Text>
      <Field.Controlled control={control} name="name" label="Name" />
      <Field.Controlled control={control} name="description" label="Description" />
      <Field.Controlled control={control} name="capacity" label="Capacity" keyboardType="number-pad" />
      <Field.Controlled control={control} name="hourlyPrice" label="Hourly price" keyboardType="number-pad" />
      <Field.Controlled control={control} name="dailyPrice" label="Daily price" keyboardType="number-pad" />
      <Field.Controlled control={control} name="coverImageUrl" label="Cover image URL" autoCapitalize="none" />
      <Field.Controlled control={control} name="availableFrom" label="Available from" />
      <Field.Controlled control={control} name="availableTo" label="Available to" />
      <Field.Controlled control={control} name="rulesText" label="Rules" multiline numberOfLines={4} textAlignVertical="top" />
      <View className="flex-row flex-wrap gap-sm">
        <Chip label="Active" selected={watch('active')} onPress={() => setValue('active', !watch('active'))} />
      </View>
      <Button label="Save amenity" loading={loading} onPress={handleSubmit((values) => onSubmit(schema.parse(values)))} />
    </Card>
  );
}
