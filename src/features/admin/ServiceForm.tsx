import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, Chip, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

export type ServiceFormValues = {
  category: string;
  name: string;
  phone?: string;
  verified: boolean;
};

interface Props {
  service?: Tables<'service_providers'> | null;
  loading?: boolean;
  onSubmit: (values: ServiceFormValues) => void;
}

export function ServiceForm({ service, loading, onSubmit }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        category: z.string().min(2, t('validation.fullNameRequired')),
        name: z.string().min(2, t('validation.fullNameRequired')),
        phone: z.string().optional(),
        verified: z.boolean(),
      }),
    [t],
  );

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
      <Text variant="headline">{service ? t('nav.screens.serviceProvider') : t('nav.screens.services')}</Text>
      <Field.Controlled control={control} name="name" label={t('common.name')} />
      <Field.Controlled control={control} name="category" label={t('admin.society.category')} placeholder={t('admin.society.placeholders.category')} />
      <Field.Controlled control={control} name="phone" label={t('common.phone')} keyboardType="phone-pad" />
      <View className="flex-row flex-wrap gap-sm">
        <Chip label={t('common.verified')} selected={watch('verified')} onPress={() => setValue('verified', !watch('verified'))} />
      </View>
      <Button label={t('admin.society.saveProvider')} loading={loading} onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}
