import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Card, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

const schema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  logoUrl: z.string().optional(),
  name: z.string().min(2, 'Society name is required'),
});

export type SocietySettingsValues = z.infer<typeof schema>;

interface Props {
  society: Tables<'societies'>;
  loading?: boolean;
  onSubmit: (values: SocietySettingsValues) => void;
}

export function SocietySettingsForm({ society, loading, onSubmit }: Props) {
  const { control, handleSubmit } = useForm<SocietySettingsValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      address: society.address ?? '',
      city: society.city ?? '',
      logoUrl: society.logo_url ?? '',
      name: society.name,
    },
  });

  return (
    <Card className="gap-md">
      <Text variant="headline">Society settings</Text>
      <Field.Controlled control={control} name="name" label="Name" />
      <Field.Controlled control={control} name="address" label="Address" />
      <Field.Controlled control={control} name="city" label="City" />
      <Field.Controlled control={control} name="logoUrl" label="Logo URL" autoCapitalize="none" />
      <Button label="Save settings" loading={loading} onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}
