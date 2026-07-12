import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Card, Chip, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

const schema = z.object({
  category: z.string().min(2, 'Category is required'),
  name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  verified: z.boolean(),
});

export type ServiceFormValues = z.infer<typeof schema>;

interface Props {
  service?: Tables<'service_providers'> | null;
  loading?: boolean;
  onSubmit: (values: ServiceFormValues) => void;
}

export function ServiceForm({ service, loading, onSubmit }: Props) {
  const { control, handleSubmit, setValue, watch } = useForm<ServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: service?.category ?? 'housekeeping',
      name: service?.name ?? '',
      phone: service?.phone ?? '',
      verified: service?.verified ?? true,
    },
  });

  return (
    <Card className="gap-md">
      <Text variant="headline">{service ? 'Edit service provider' : 'Add service provider'}</Text>
      <Field.Controlled control={control} name="name" label="Name" />
      <Field.Controlled control={control} name="category" label="Category" placeholder="plumber, electrician, housekeeping" />
      <Field.Controlled control={control} name="phone" label="Phone" keyboardType="phone-pad" />
      <View className="flex-row flex-wrap gap-sm">
        <Chip label="Verified" selected={watch('verified')} onPress={() => setValue('verified', !watch('verified'))} />
      </View>
      <Button label="Save provider" loading={loading} onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}
