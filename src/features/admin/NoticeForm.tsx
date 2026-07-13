import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Card, Chip, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

const categories = ['general', 'event', 'maintenance', 'emergency', 'financial'] as const;

const schema = z.object({
  body: z.string().min(3, 'Body is required'),
  category: z.enum(categories),
  pinned: z.boolean(),
  title: z.string().min(3, 'Title is required'),
});

export type NoticeFormValues = z.infer<typeof schema>;

interface Props {
  notice?: Tables<'notices'> | null;
  loading?: boolean;
  onSaveDraft: (values: NoticeFormValues) => void;
  onPublish: (values: NoticeFormValues) => void;
}

export function NoticeForm({ notice, loading, onPublish, onSaveDraft }: Props) {
  const { control, handleSubmit, setValue, watch } = useForm<NoticeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      body: notice?.body ?? '',
      category: notice?.category ?? 'general',
      pinned: notice?.pinned ?? false,
      title: notice?.title ?? '',
    },
  });
  const category = watch('category');
  const pinned = watch('pinned');

  return (
    <Card className="gap-md">
      <Text variant="headline">{notice ? 'Edit notice' : 'Create notice'}</Text>
      <View className="flex-row flex-wrap gap-sm">
        {categories.map((item) => (
          <Chip key={item} label={item} selected={category === item} onPress={() => setValue('category', item)} />
        ))}
      </View>
      <Field.Controlled control={control} name="title" label="Title" />
      <Field.Controlled control={control} name="body" label="Body" multiline numberOfLines={5} textAlignVertical="top" />
      <Text variant="footnote" color="textSecondary">
        Audience: all residents. Attachments and scheduled delivery can be layered onto the existing `attachments` and `target_audience` JSON fields.
      </Text>
      <View className="flex-row flex-wrap gap-sm">
        <Chip label="Pin" selected={pinned} onPress={() => setValue('pinned', !pinned)} />
      </View>
      <View className="flex-row gap-md">
        <Button label="Save draft" variant="outlined" full className="flex-1" loading={loading} onPress={handleSubmit(onSaveDraft)} />
        <Button label="Publish" full className="flex-1" loading={loading} onPress={handleSubmit(onPublish)} />
      </View>
    </Card>
  );
}
