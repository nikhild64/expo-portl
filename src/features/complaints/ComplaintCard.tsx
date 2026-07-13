import { Pressable, View } from 'react-native';

import { Card, Chip, StatusPill, Text } from '@/components';
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

interface ComplaintAction {
  label: string;
  onPress: () => void;
}

interface Props {
  complaint: Tables<'complaints'>;
  onPress?: () => void;
  actions?: ComplaintAction[];
}

export function ComplaintCard({ complaint, onPress, actions }: Props) {
  const card = (
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
      {actions && actions.length > 0 ? (
        <View className="flex-row flex-wrap gap-xs border-t border-border pt-sm">
          {actions.map((action) => (
            <Chip key={action.label} label={action.label} variant="assist" onPress={action.onPress} />
          ))}
        </View>
      ) : null}
    </Card>
  );

  if (!onPress) return card;

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {card}
    </Pressable>
  );
}
