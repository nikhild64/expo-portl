import { router } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { alertError } from '@/lib/alert';
import type { NoticeFormValues } from '@/features/admin/NoticeForm';
import { useCreateNotice, useUpdateNotice } from '@/queries/useNoticeMutations';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

function draftDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 10);
  return date.toISOString();
}

export function useNoticeSave(notice?: Tables<'notices'>) {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();
  const isEdit = !!notice;

  const loading = isEdit ? updateNotice.isPending : createNotice.isPending;

  const save = useCallback(
    async (values: NoticeFormValues, publishedAt: string) => {
      try {
        if (isEdit && notice) {
          await updateNotice.mutateAsync({
            id: notice.id,
            patch: {
              body: values.body,
              category: values.category,
              pinned: values.pinned,
              published_at: publishedAt,
              target_audience: { kind: 'all' },
              title: values.title,
            },
          });
        } else {
          if (!profile?.id || !profile.society_id) return;
          await createNotice.mutateAsync({
            attachments: [],
            body: values.body,
            category: values.category,
            created_by: profile.id,
            pinned: values.pinned,
            published_at: publishedAt,
            society_id: profile.society_id,
            target_audience: { kind: 'all' },
            title: values.title,
          });
        }
        router.back();
      } catch (error) {
        alertError(t('alert.titles.saveFailed'), error);
      }
    },
    [createNotice, isEdit, notice, profile?.id, profile?.society_id, t, updateNotice],
  );

  return {
    loading,
    onSaveDraft: (values: NoticeFormValues) => save(values, draftDate()),
    onPublish: (values: NoticeFormValues) => save(values, new Date().toISOString()),
  };
}
