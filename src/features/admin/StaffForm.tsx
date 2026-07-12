import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Card, Chip, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

const schema = z.object({
  active: z.boolean(),
  name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  photoUrl: z.string().optional(),
  role: z.string().min(2, 'Role is required'),
  shiftEnd: z.string().optional(),
  shiftStart: z.string().optional(),
  verified: z.boolean(),
});

export type StaffFormValues = z.infer<typeof schema>;

interface Props {
  staff?: Tables<'staff'> | null;
  loading?: boolean;
  onSubmit: (values: StaffFormValues) => void;
}

export function StaffForm({ staff, loading, onSubmit }: Props) {
  const { control, handleSubmit, setValue, watch } = useForm<StaffFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      active: staff?.active ?? true,
      name: staff?.name ?? '',
      phone: staff?.phone ?? '',
      photoUrl: staff?.photo_url ?? '',
      role: staff?.role ?? 'guard',
      shiftEnd: staff?.shift_end ?? '',
      shiftStart: staff?.shift_start ?? '',
      verified: staff?.verified ?? true,
    },
  });

  return (
    <Card className="gap-md">
      <Text variant="headline">{staff ? 'Edit staff' : 'Add staff'}</Text>
      <Field.Controlled control={control} name="name" label="Name" />
      <Field.Controlled control={control} name="role" label="Role" placeholder="guard, cleaner, supervisor" />
      <Field.Controlled control={control} name="phone" label="Phone" keyboardType="phone-pad" />
      <Field.Controlled control={control} name="shiftStart" label="Shift start" placeholder="09:00" />
      <Field.Controlled control={control} name="shiftEnd" label="Shift end" placeholder="18:00" />
      <Field.Controlled control={control} name="photoUrl" label="Photo URL" autoCapitalize="none" />
      <View className="flex-row flex-wrap gap-sm">
        <Chip label="Verified" selected={watch('verified')} onPress={() => setValue('verified', !watch('verified'))} />
        <Chip label="Active" selected={watch('active')} onPress={() => setValue('active', !watch('active'))} />
      </View>
      <Button label="Save staff" loading={loading} onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}
