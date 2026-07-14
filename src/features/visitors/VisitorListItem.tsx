import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Card, StatusPill, Text } from '@/components';
import { visitorStatusLabel, visitorStatusTone } from '@/features/visitors/visitorStatus';
import { formatRelativeTime, titleize } from '@/lib/format';
import { VISITOR_PHOTOS_BUCKET } from '@/lib/storage';
import type { Tables } from '@/types/database';

interface Props {
  visitor: Tables<'visitors'>;
  onPress?: () => void;
  imageUri?: string;
}

export const VisitorListItem = memo(function VisitorListItem({ visitor, onPress, imageUri }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.visitor', { name: visitor.visitor_name })}
    >
      <Card variant="outlined" className="gap-sm">
        <View className="flex-row items-center gap-md">
          <Avatar
            imageUri={imageUri}
            name={visitor.visitor_name}
            storageBucket={imageUri ? undefined : VISITOR_PHOTOS_BUCKET}
            uri={imageUri ? undefined : visitor.visitor_photo_path}
            size="md"
          />
          <View className="flex-1">
            <Text variant="headline">{visitor.visitor_name}</Text>
            <Text variant="footnote" color="textSecondary">
              {titleize(visitor.type)} {visitor.purpose ? `- ${visitor.purpose}` : ''}
            </Text>
          </View>
          <StatusPill tone={visitorStatusTone(visitor.status)} label={visitorStatusLabel(visitor.status)} />
        </View>
        <Text variant="caption" color="textTertiary">
          {formatRelativeTime(visitor.requested_at)}
        </Text>
      </Card>
    </Pressable>
  );
});
