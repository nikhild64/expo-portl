import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Card, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

const flatSchema = z.object({
  bhk: z.coerce.number().int().min(0).optional(),
  floor: z.coerce.number().int().min(0).optional(),
  number: z.string().min(1, 'Flat number is required'),
});

const bulkSchema = z.object({
  floors: z.coerce.number().int().min(1),
  unitsPerFloor: z.coerce.number().int().min(1),
});

export type FlatFormValues = z.output<typeof flatSchema>;
export type BulkFlatValues = z.output<typeof bulkSchema>;

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
      <Text variant="headline">{flat ? 'Edit flat' : 'Add flat'}</Text>
      <Field.Controlled control={control} name="number" label="Flat number" placeholder="101" />
      <Field.Controlled control={control} name="floor" label="Floor" keyboardType="number-pad" />
      <Field.Controlled control={control} name="bhk" label="BHK" keyboardType="number-pad" />
      <Button label="Save flat" loading={loading} onPress={handleSubmit((values) => onSubmit(flatSchema.parse(values)))} />
    </Card>
  );
}

export function BulkFlatForm({ loading, onSubmit }: BulkFormProps) {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(bulkSchema),
    defaultValues: { floors: 20, unitsPerFloor: 4 },
  });

  return (
    <Card className="gap-md">
      <Text variant="headline">Bulk generate flats</Text>
      <Text variant="footnote" color="textSecondary">
        Creates numbers like 101, 102, ... for every floor.
      </Text>
      <Field.Controlled control={control} name="floors" label="Floors" keyboardType="number-pad" />
      <Field.Controlled control={control} name="unitsPerFloor" label="Units per floor" keyboardType="number-pad" />
      <Button label="Generate flats" variant="tonal" loading={loading} onPress={handleSubmit((values) => onSubmit(bulkSchema.parse(values)))} />
    </Card>
  );
}
