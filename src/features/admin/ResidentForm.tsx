import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, Chip, Field, Text } from '@/components';
import type { ResidentWithFlats } from '@/queries/useAdminResidents';

export type ResidentFormValues = {
  fullName: string;
  phone?: string;
  status: 'pending' | 'active' | 'blocked';
};

interface Props {
  resident: ResidentWithFlats;
  heading?: string;
  loading?: boolean;
  onSubmit: (values: ResidentFormValues) => void;
}

export function ResidentForm({ resident, heading, loading, onSubmit }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().min(2, t('validation.fullNameRequired')),
        phone: z.string().optional(),
        status: z.enum(['pending', 'active', 'blocked']),
      }),
    [t],
  );

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
      <Text variant="headline">{heading ?? t('admin.society.residentProfile')}</Text>
      <Field.Controlled control={control} name="fullName" label={t('auth.signUp.fullName')} placeholder={t('admin.society.placeholders.residentName')} />
      <Field.Controlled control={control} name="phone" label={t('common.phone')} placeholder={t('admin.society.placeholders.phone')} keyboardType="phone-pad" />
      <View className="gap-sm">
        <Text variant="footnote" color="textSecondary">
          {t('common.status')}
        </Text>
        <View className="flex-row flex-wrap gap-sm">
          {(['active', 'pending', 'blocked'] as const).map((item) => (
            <Chip key={item} label={t(`status.${item}`)} selected={status === item} onPress={() => setValue('status', item)} />
          ))}
        </View>
      </View>
      <Button label={t('admin.society.saveChanges')} loading={loading} onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}
