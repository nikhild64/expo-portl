import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { Card, IconSymbol, StatusPill, Text } from '@/components';
import { formatDate, titleize } from '@/lib/format';
import type { Tables } from '@/types/database';

interface Props {
  notice: Tables<'notices'>;
}

export function NoticeStripCard({ notice }: Props) {
  return (
    <Pressable onPress={() => router.push(`/(resident)/(home)/notices/${notice.id}` as Href)}>
      <Card variant="outlined" className="gap-sm">
        <View className="flex-row items-center justify-between gap-sm">
          <View className="flex-row items-center gap-sm">
            <IconSymbol name="campaign" color="coral" size={20} />
            <Text variant="caption" color="textSecondary">
              {titleize(notice.category)}
            </Text>
          </View>
          {notice.pinned && <StatusPill tone="warning" label="Pinned" />}
        </View>
        <Text variant="headline">{notice.title}</Text>
        <Text variant="footnote" color="textSecondary" numberOfLines={2}>
          {notice.body}
        </Text>
        <Text variant="caption" color="textTertiary">
          {formatDate(notice.published_at)}
        </Text>
      </Card>
    </Pressable>
  );
}
