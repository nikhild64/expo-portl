import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Card, Chip, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

const categories = ['general', 'amenities', 'rules', 'events', 'finance'] as const;

const schema = z.object({
  allowMultiple: z.boolean(),
  anonymous: z.boolean(),
  category: z.enum(categories),
  endsAt: z.string().min(1, 'End date is required'),
  option1: z.string().min(1, 'At least two options are required'),
  option2: z.string().min(1, 'At least two options are required'),
  option3: z.string().optional(),
  option4: z.string().optional(),
  option5: z.string().optional(),
  option6: z.string().optional(),
  question: z.string().min(3, 'Question is required'),
  quorum: z.coerce.number().min(0).max(100),
  showResults: z.boolean(),
  startsAt: z.string().min(1, 'Start date is required'),
});

export type PollFormValues = z.output<typeof schema>;

interface Props {
  poll?: Tables<'polls'> | null;
  loading?: boolean;
  onSubmit: (values: PollFormValues) => void;
}

function optionsFromPoll(poll?: Tables<'polls'> | null) {
  const raw = Array.isArray(poll?.options) ? poll.options : [];
  return raw.map((option) => (typeof option === 'object' && option && 'label' in option ? String(option.label) : ''));
}

export function pollOptions(values: PollFormValues) {
  return [values.option1, values.option2, values.option3, values.option4, values.option5, values.option6]
    .map((label) => label?.trim())
    .filter(Boolean)
    .map((label) => ({ label }));
}

export function PollForm({ poll, loading, onSubmit }: Props) {
  const options = optionsFromPoll(poll);
  const { control, handleSubmit, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      allowMultiple: poll?.allow_multiple ?? false,
      anonymous: poll?.anonymous ?? false,
      category: poll?.category ?? 'general',
      endsAt: poll?.ends_at ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      option1: options[0] ?? '',
      option2: options[1] ?? '',
      option3: options[2] ?? '',
      option4: options[3] ?? '',
      option5: options[4] ?? '',
      option6: options[5] ?? '',
      question: poll?.question ?? '',
      quorum: poll?.quorum ?? 50,
      showResults: poll?.show_results ?? true,
      startsAt: poll?.starts_at ?? new Date().toISOString(),
    },
  });
  const category = watch('category');

  return (
    <Card className="gap-md">
      <Text variant="headline">{poll ? 'Edit poll' : 'Create poll'}</Text>
      <View className="flex-row flex-wrap gap-sm">
        {categories.map((item) => (
          <Chip key={item} label={item} selected={category === item} onPress={() => setValue('category', item)} />
        ))}
      </View>
      <Field.Controlled control={control} name="question" label="Question" />
      {(['option1', 'option2', 'option3', 'option4', 'option5', 'option6'] as const).map((name, index) => (
        <Field.Controlled key={name} control={control} name={name} label={`Option ${index + 1}`} />
      ))}
      <Field.Controlled control={control} name="startsAt" label="Starts at (ISO)" autoCapitalize="none" />
      <Field.Controlled control={control} name="endsAt" label="Ends at (ISO)" autoCapitalize="none" />
      <Field.Controlled control={control} name="quorum" label="Quorum %" keyboardType="number-pad" />
      <View className="flex-row flex-wrap gap-sm">
        <Chip label="Multiple" selected={watch('allowMultiple')} onPress={() => setValue('allowMultiple', !watch('allowMultiple'))} />
        <Chip label="Anonymous" selected={watch('anonymous')} onPress={() => setValue('anonymous', !watch('anonymous'))} />
        <Chip label="Live results" selected={watch('showResults')} onPress={() => setValue('showResults', !watch('showResults'))} />
      </View>
      <Button label={poll ? 'Save poll' : 'Publish poll'} loading={loading} onPress={handleSubmit((values) => onSubmit(schema.parse(values)))} />
    </Card>
  );
}
