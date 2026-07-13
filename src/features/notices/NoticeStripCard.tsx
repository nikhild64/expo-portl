import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, IconSymbol, StatusPill, Text } from '@/components';
import { formatRelativeTime, titleize } from '@/lib/format';
import type { Tables } from '@/types/database';

interface Props {
  notice: Tables<'notices'>;
}

export function NoticeStripCard({ notice }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/(resident)/(home)/notices/[id]', params: { id: notice.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={t('a11y.notice', { title: notice.title })}
    >
      <Card variant="outlined" className="gap-sm">
        <View className="flex-row items-center justify-between gap-sm">
          <View className="flex-row items-center gap-sm">
            <IconSymbol name="campaign" color="coral" size={20} />
            <Text variant="caption" color="textSecondary">
              {titleize(notice.category)}
            </Text>
          </View>
          {notice.pinned && <StatusPill tone="warning" label={t('common.pinned')} />}
        </View>
        <Text variant="headline">{notice.title}</Text>
        <Text variant="footnote" color="textSecondary" numberOfLines={2}>
          {notice.body}
        </Text>
        <Text variant="caption" color="textTertiary">
          {formatRelativeTime(notice.published_at)}
        </Text>
      </Card>
    </Pressable>
  );
}
