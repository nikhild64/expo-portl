import { useEffect } from 'react';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Card, Chip, Field, Text } from '@/components';
import type { ResidentWithFlats } from '@/queries/useAdminResidents';

const schema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  status: z.enum(['pending', 'active', 'blocked']),
});

export type ResidentFormValues = z.infer<typeof schema>;

interface Props {
  resident: ResidentWithFlats;
  loading?: boolean;
  onSubmit: (values: ResidentFormValues) => void;
}

export function ResidentForm({ resident, loading, onSubmit }: Props) {
  const { control, handleSubmit, setValue, watch, reset } = useForm<ResidentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: resident.full_name,
      phone: resident.phone ?? '',
      status: resident.status,
    },
  });
  const status = watch('status');

  useEffect(() => {
    reset({ fullName: resident.full_name, phone: resident.phone ?? '', status: resident.status });
  }, [resident, reset]);

  return (
    <Card className="gap-md">
      <Text variant="headline">Resident profile</Text>
      <Field.Controlled control={control} name="fullName" label="Full name" placeholder="Resident name" />
      <Field.Controlled control={control} name="phone" label="Phone" placeholder="Phone number" keyboardType="phone-pad" />
      <View className="gap-sm">
        <Text variant="footnote" color="textSecondary">
          Status
        </Text>
        <View className="flex-row flex-wrap gap-sm">
          {(['active', 'pending', 'blocked'] as const).map((item) => (
            <Chip key={item} label={item} selected={status === item} onPress={() => setValue('status', item)} />
          ))}
        </View>
      </View>
      <Button label="Save changes" loading={loading} onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}
