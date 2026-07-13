import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, Chip, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

export type StaffFormValues = {
  active: boolean;
  name: string;
  phone?: string;
  photoUrl?: string;
  role: string;
  shiftEnd?: string;
  shiftStart?: string;
  verified: boolean;
};

interface Props {
  staff?: Tables<'staff'> | null;
  loading?: boolean;
  onSubmit: (values: StaffFormValues) => void;
}

export function StaffForm({ staff, loading, onSubmit }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        active: z.boolean(),
        name: z.string().min(2, t('validation.fullNameRequired')),
        phone: z.string().optional(),
        photoUrl: z.string().optional(),
        role: z.string().min(2, t('validation.fullNameRequired')),
        shiftEnd: z.string().optional(),
        shiftStart: z.string().optional(),
        verified: z.boolean(),
      }),
    [t],
  );

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
      <Text variant="headline">{staff ? t('nav.screens.staffMember') : t('nav.screens.staff')}</Text>
      <Field.Controlled control={control} name="name" label={t('common.name')} />
      <Field.Controlled control={control} name="role" label={t('admin.society.role')} placeholder={t('admin.society.placeholders.role')} />
      <Field.Controlled control={control} name="phone" label={t('common.phone')} keyboardType="phone-pad" />
      <Field.Controlled control={control} name="shiftStart" label={t('admin.society.shiftStart')} placeholder={t('admin.society.placeholders.shiftStart')} />
      <Field.Controlled control={control} name="shiftEnd" label={t('admin.society.shiftEnd')} placeholder={t('admin.society.placeholders.shiftEnd')} />
      <Field.Controlled control={control} name="photoUrl" label={t('admin.society.photoUrl')} autoCapitalize="none" />
      <View className="flex-row flex-wrap gap-sm">
        <Chip label={t('common.verified')} selected={watch('verified')} onPress={() => setValue('verified', !watch('verified'))} />
        <Chip label={t('common.active')} selected={watch('active')} onPress={() => setValue('active', !watch('active'))} />
      </View>
      <Button label={t('admin.society.saveStaff')} loading={loading} onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}
