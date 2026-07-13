import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, Field, Text } from '@/components';

export type GuardFormValues = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
};

interface Props {
  loading?: boolean;
  onSubmit: (values: GuardFormValues) => void;
}

export function GuardForm({ loading, onSubmit }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        fullName: z.string().min(2, t('validation.fullNameRequired')),
        email: z.string().email(t('validation.validEmail')),
        password: z.string().min(8, t('validation.minPassword')),
        phone: z.string().optional(),
      }),
    [t],
  );

  const { control, handleSubmit } = useForm<GuardFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  return (
    <Card className="gap-md">
      <Text variant="headline">{t('admin.society.newGuardAccount')}</Text>
      <Text variant="body" color="textSecondary">
        {t('admin.society.guardAccountNote')}
      </Text>
      <Field.Controlled control={control} name="fullName" label={t('auth.signUp.fullName')} autoCapitalize="words" />
      <Field.Controlled
        control={control}
        name="email"
        label={t('common.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <Field.Controlled
        control={control}
        name="password"
        label={t('admin.society.temporaryPassword')}
        secureTextEntry
        autoComplete="new-password"
        helper={t('admin.society.tempPasswordHelper')}
      />
      <Field.Controlled
        control={control}
        name="phone"
        label={t('common.phone')}
        keyboardType="phone-pad"
        autoCapitalize="none"
      />
      <Button label={t('admin.society.createGuardAccount')} loading={loading} onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}
