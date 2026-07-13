import { Pressable, View } from 'react-native';

import { Card, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import type { Tables } from '@/types/database';

const priorityAccent: Record<Tables<'complaints'>['priority'], 'none' | 'warning' | 'danger' | 'success'> = {
  high: 'warning',
  low: 'none',
  medium: 'warning',
  urgent: 'danger',
};

const statusTone: Record<Tables<'complaints'>['status'], 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  assigned: 'info',
  closed: 'neutral',
  in_progress: 'warning',
  new: 'neutral',
  resolved: 'success',
};

interface Props {
  complaint: Tables<'complaints'>;
  onPress?: () => void;
}

export function ComplaintCard({ complaint, onPress }: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card variant="outlined" accent={priorityAccent[complaint.priority]} className="gap-sm">
        <View className="flex-row items-start justify-between gap-sm">
          <View className="flex-1">
            <Text variant="headline">{complaint.title}</Text>
            <Text variant="footnote" color="textSecondary">
              {titleize(complaint.category)} - {formatDateTime(complaint.created_at)}
            </Text>
          </View>
          <StatusPill tone={statusTone[complaint.status]} label={titleize(complaint.status)} />
        </View>
        <Text variant="body" color="textSecondary" numberOfLines={2}>
          {complaint.description}
        </Text>
        <Text variant="caption" color="textTertiary">
          Priority: {titleize(complaint.priority)}
        </Text>
      </Card>
    </Pressable>
  );
}
