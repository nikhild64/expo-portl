import { Pressable, View } from 'react-native';

import { Avatar, Card, StatusPill, Text } from '@/components';
import { formatRelativeTime, titleize } from '@/lib/format';
import type { Tables } from '@/types/database';

const statusTone: Record<Tables<'visitors'>['status'], 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  approved: 'success',
  entered: 'success',
  exited: 'neutral',
  expired: 'neutral',
  pending: 'warning',
  rejected: 'danger',
};

interface Props {
  visitor: Tables<'visitors'>;
  onPress?: () => void;
}

export function VisitorListItem({ visitor, onPress }: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Visitor ${visitor.visitor_name}`}>
      <Card variant="outlined" className="gap-sm">
        <View className="flex-row items-center gap-md">
          <Avatar name={visitor.visitor_name} uri={visitor.visitor_photo_url ?? undefined} size="md" />
          <View className="flex-1">
            <Text variant="headline">{visitor.visitor_name}</Text>
            <Text variant="footnote" color="textSecondary">
              {titleize(visitor.type)} {visitor.purpose ? `- ${visitor.purpose}` : ''}
            </Text>
          </View>
          <StatusPill tone={statusTone[visitor.status]} label={titleize(visitor.status)} />
        </View>
        <Text variant="caption" color="textTertiary">
          {formatRelativeTime(visitor.requested_at)}
        </Text>
      </Card>
    </Pressable>
  );
}
