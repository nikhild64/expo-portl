import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Card, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

const schema = z.object({
  name: z.string().min(1, 'Tower name is required'),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export type TowerFormValues = z.output<typeof schema>;

interface Props {
  tower?: Tables<'towers'> | null;
  loading?: boolean;
  onSubmit: (values: TowerFormValues) => void;
}

export function TowerForm({ tower, loading, onSubmit }: Props) {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: tower?.name ?? '',
      sortOrder: tower?.sort_order ?? 0,
    },
  });

  return (
    <Card className="gap-md">
      <Text variant="headline">{tower ? 'Edit tower' : 'Add tower'}</Text>
      <Field.Controlled control={control} name="name" label="Tower name" placeholder="A" />
      <Field.Controlled control={control} name="sortOrder" label="Sort order" keyboardType="number-pad" />
      <Button label="Save tower" loading={loading} onPress={handleSubmit((values) => onSubmit(schema.parse(values)))} />
    </Card>
  );
}
