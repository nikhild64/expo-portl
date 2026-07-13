import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, IconSymbol, StatusPill, Text } from '@/components';
import { formatRelativeTime, titleize } from '@/lib/format';
import type { Tables } from '@/types/database';

interface Props {
  notice: Tables<'notices'>;
  onPress?: () => void;
}

export function NoticeCard({ notice, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card
        variant="outlined"
        className="gap-sm"
      >
        <View className="flex-row items-center justify-between gap-sm">
          <View className="flex-row items-center gap-sm">
            <IconSymbol name="campaign" color="coral" />
            <Text variant="caption" color="textSecondary">
              {titleize(notice.category)}
            </Text>
          </View>
          {notice.pinned && <StatusPill tone="warning" label={t('common.pinned')} />}
        </View>
        <Text variant="title">{notice.title}</Text>
        <Text variant="body" color="textSecondary" numberOfLines={3}>
          {notice.body}
        </Text>
        <Text variant="caption" color="textTertiary">
          {formatRelativeTime(notice.published_at)}
        </Text>
      </Card>
    </Pressable>
  );
}
