import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Card, Field, Text } from '@/components';
import type { DuesLineItem } from '@/queries/useDuesAdmin';

const schema = z.object({
  dueDate: z.string().min(1, 'Due date is required'),
  line1Amount: z.coerce.number().min(0),
  line1Label: z.string().min(1),
  line2Amount: z.coerce.number().min(0).optional(),
  line2Label: z.string().optional(),
  period: z.string().min(1, 'Period is required'),
});

export type DuesCycleFormValues = z.output<typeof schema>;

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
      <Text variant="headline">Generate dues cycle</Text>
      <Field.Controlled control={control} name="period" label="Period (first day of month)" />
      <Field.Controlled control={control} name="dueDate" label="Due date" />
      <Field.Controlled control={control} name="line1Label" label="Line item 1" />
      <Field.Controlled control={control} name="line1Amount" label="Amount" keyboardType="number-pad" />
      <Field.Controlled control={control} name="line2Label" label="Line item 2 (optional)" />
      <Field.Controlled control={control} name="line2Amount" label="Amount" keyboardType="number-pad" />
      <Button label="Generate cycle" loading={loading} onPress={handleSubmit((values) => submit(schema.parse(values)))} />
    </Card>
  );
}
