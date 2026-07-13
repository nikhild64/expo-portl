import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, Chip, Field, Text } from '@/components';
import type { Tables } from '@/types/database';

const categories = ['general', 'event', 'maintenance', 'emergency', 'financial'] as const;

export type NoticeFormValues = {
  body: string;
  category: (typeof categories)[number];
  pinned: boolean;
  title: string;
};

interface Props {
  notice?: Tables<'notices'> | null;
  loading?: boolean;
  onSaveDraft: (values: NoticeFormValues) => void;
  onPublish: (values: NoticeFormValues) => void;
}

export function NoticeForm({ notice, loading, onPublish, onSaveDraft }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        body: z.string().min(3, t('validation.fullNameRequired')),
        category: z.enum(categories),
        pinned: z.boolean(),
        title: z.string().min(3, t('validation.fullNameRequired')),
      }),
    [t],
  );

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
      <Text variant="headline">{notice ? t('nav.screens.editNotice') : t('nav.screens.newNotice')}</Text>
      <View className="flex-row flex-wrap gap-sm">
        {categories.map((item) => (
          <Chip key={item} label={item} selected={category === item} onPress={() => setValue('category', item)} />
        ))}
      </View>
      <Field.Controlled control={control} name="title" label={t('common.title')} />
      <Field.Controlled control={control} name="body" label={t('admin.community.noticeBody')} multiline numberOfLines={5} textAlignVertical="top" />
      <View className="flex-row flex-wrap gap-sm">
        <Chip label={t('admin.community.pin')} selected={pinned} onPress={() => setValue('pinned', !pinned)} />
      </View>
      <View className="flex-row gap-md">
        <Button label={t('admin.community.saveDraft')} variant="outlined" full className="flex-1" loading={loading} onPress={handleSubmit(onSaveDraft)} />
        <Button label={t('common.publish')} full className="flex-1" loading={loading} onPress={handleSubmit(onPublish)} />
      </View>
    </Card>
  );
}
