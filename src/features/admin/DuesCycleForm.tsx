import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, Field, Text } from '@/components';
import type { DuesLineItem } from '@/queries/useDuesAdmin';

export type DuesCycleFormValues = {
  dueDate: string;
  line1Amount: number;
  line1Label: string;
  line2Amount?: number;
  line2Label?: string;
  period: string;
};

interface Props {
  loading?: boolean;
  onSubmit: (values: DuesCycleFormValues & { lineItems: DuesLineItem[]; total: number }) => void;
}

function nextMonthPeriod() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 1);
  return date.toISOString().slice(0, 10);
}

export function DuesCycleForm({ loading, onSubmit }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        dueDate: z.string().min(1, t('validation.endTimeRequired')),
        line1Amount: z.coerce.number().min(0),
        line1Label: z.string().min(1),
        line2Amount: z.coerce.number().min(0).optional(),
        line2Label: z.string().optional(),
        period: z.string().min(1, t('validation.startTimeRequired')),
      }),
    [t],
  );

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      dueDate: nextMonthPeriod(),
      line1Amount: 2500,
      line1Label: 'Maintenance',
      line2Amount: 0,
      line2Label: '',
      period: nextMonthPeriod(),
    },
  });

  const submit = (values: DuesCycleFormValues) => {
    const lineItems = [
      { label: values.line1Label, amount: values.line1Amount },
      values.line2Label ? { label: values.line2Label, amount: values.line2Amount ?? 0 } : null,
    ].filter(Boolean) as DuesLineItem[];
    onSubmit({ ...values, lineItems, total: lineItems.reduce((sum, item) => sum + item.amount, 0) });
  };

  return (
    <Card className="gap-md">
      <Text variant="headline">{t('admin.ops.generateDuesCycle')}</Text>
      <Field.Controlled control={control} name="period" label={t('admin.ops.period')} />
      <Field.Controlled control={control} name="dueDate" label={t('admin.ops.dueDate')} />
      <Field.Controlled control={control} name="line1Label" label={t('admin.ops.lineItem1')} />
      <Field.Controlled control={control} name="line1Amount" label={t('common.amount')} keyboardType="number-pad" />
      <Field.Controlled control={control} name="line2Label" label={t('admin.ops.lineItem2Optional')} />
      <Field.Controlled control={control} name="line2Amount" label={t('common.amount')} keyboardType="number-pad" />
      <Button label={t('admin.ops.generateCycle')} loading={loading} onPress={handleSubmit((values) => submit(schema.parse(values)))} />
    </Card>
  );
}
