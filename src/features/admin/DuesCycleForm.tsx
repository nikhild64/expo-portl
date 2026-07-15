import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, DateField, Field, Text } from '@/components';
import { formatMoney, startOfMonthDate } from '@/lib/format';
import type { DuesLineItem } from '@/features/payments/lineItems';

function createDuesCycleSchema(t: TFunction) {
  return z.object({
    dueDate: z.string().min(1, t('validation.endTimeRequired')),
    lineItems: z
      .array(
        z.object({
          amount: z.coerce.number().min(0),
          label: z.string(),
        }),
      )
      .min(1),
    period: z.string().min(1, t('validation.startTimeRequired')),
  });
}

export type DuesCycleFormValues = z.infer<ReturnType<typeof createDuesCycleSchema>>;

interface Props {
  defaultLineItems?: DuesLineItem[];
  loading?: boolean;
  onSubmit: (values: DuesCycleFormValues & { lineItems: DuesLineItem[]; total: number }) => void;
}

const FALLBACK_LINE_ITEMS: DuesLineItem[] = [
  { label: 'Maintenance', amount: 6500 },
  { label: 'Water charges', amount: 450 },
  { label: 'Common electricity', amount: 890 },
  { label: 'Property tax', amount: 400 },
];

function nextMonthPeriod() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 1);
  return startOfMonthDate(date);
}

function normalizeLineItems(items: DuesLineItem[]) {
  return items
    .map((item) => ({ label: item.label.trim(), amount: Number(item.amount) || 0 }))
    .filter((item) => item.label.length > 0);
}

export function DuesCycleForm({ defaultLineItems, loading, onSubmit }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(() => createDuesCycleSchema(t), [t]);

  const initialLineItems = defaultLineItems?.length ? defaultLineItems : FALLBACK_LINE_ITEMS;

  const { control, handleSubmit, reset, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      dueDate: nextMonthPeriod(),
      lineItems: initialLineItems,
      period: nextMonthPeriod(),
    },
  });

  const { append, fields, remove } = useFieldArray({ control, name: 'lineItems' });
  const lineItems = watch('lineItems');
  const monthlyTotal = (lineItems ?? []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  useEffect(() => {
    if (!defaultLineItems?.length) return;
    reset((current) => ({
      ...current,
      lineItems: defaultLineItems,
    }));
  }, [defaultLineItems, reset]);

  const submit = (values: DuesCycleFormValues) => {
    const lineItemsForSubmit = normalizeLineItems(values.lineItems);
    if (!lineItemsForSubmit.length) return;

    onSubmit({
      ...values,
      lineItems: lineItemsForSubmit,
      total: lineItemsForSubmit.reduce((sum, item) => sum + item.amount, 0),
    });
  };

  return (
    <Card className="gap-md">
      <Text variant="headline">{t('admin.ops.generateDuesCycle')}</Text>
      <Controller
        control={control}
        name="period"
        render={({ field, fieldState }) => (
          <DateField
            label={t('admin.ops.period')}
            value={field.value}
            selectedLabel={t('common.selected')}
            helper={t('admin.ops.periodHelper')}
            error={fieldState.error?.message}
            normalizeToMonthStart
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="dueDate"
        render={({ field, fieldState }) => (
          <DateField
            label={t('admin.ops.dueDate')}
            value={field.value}
            selectedLabel={t('common.selected')}
            error={fieldState.error?.message}
            onChange={field.onChange}
          />
        )}
      />

      <View className="gap-sm">
        <Text variant="footnote" color="textSecondary">
          {t('admin.ops.monthlyCharges')}
        </Text>
        {fields.map((field, index) => (
          <View key={field.id} className="gap-sm rounded-md border border-border bg-surface-secondary p-md">
            <Field.Controlled control={control} name={`lineItems.${index}.label`} label={t('admin.ops.chargeLabel')} />
            <Field.Controlled
              control={control}
              name={`lineItems.${index}.amount`}
              label={t('common.amount')}
              keyboardType="number-pad"
            />
            {fields.length > 1 ? (
              <Button label={t('admin.ops.removeCharge')} variant="text" icon="remove" onPress={() => remove(index)} />
            ) : null}
          </View>
        ))}
        <Button label={t('admin.ops.addCharge')} variant="outlined" icon="add" onPress={() => append({ label: '', amount: 0 })} />
      </View>

      <View className="flex-row items-center justify-between border-t border-border pt-md">
        <Text variant="headline">{t('admin.ops.monthlyTotal')}</Text>
        <Text variant="titleLarge">{formatMoney(monthlyTotal)}</Text>
      </View>

      <Button label={t('admin.ops.generateCycle')} loading={loading} onPress={handleSubmit((values) => submit(schema.parse(values)))} />
    </Card>
  );
}
