import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, IconSymbol, StatusPill, Text } from '@/components';
import { formatRelativeTime, formatTicketNumber } from '@/lib/format';
import type { ComplaintWithFlat } from '@/queries/useComplaints';

import { COMPLAINT_CATEGORY_ICONS } from './constants';
import { StatusTimeline } from './StatusTimeline';

interface ComplaintAction {
  label: string;
  onPress: () => void;
}

interface Props {
  complaint: ComplaintWithFlat;
  onPress?: () => void;
  actions?: ComplaintAction[];
}

export function ComplaintCard({ complaint, onPress, actions }: Props) {
  const { t } = useTranslation();
  const categoryIcon = COMPLAINT_CATEGORY_ICONS[complaint.category as keyof typeof COMPLAINT_CATEGORY_ICONS] ?? 'info';

  const priorityBadge: Partial<
    Record<ComplaintWithFlat['priority'], { label: string; tone: 'danger' | 'warning' | 'info' | 'neutral' }>
  > = {
    urgent: { label: t('resident.complaints.urgent'), tone: 'danger' },
    high: { label: t('resident.complaints.highPriority'), tone: 'warning' },
  };
  const badge = priorityBadge[complaint.priority];

  const card = (
    <Card variant="outlined" className="gap-md">
      <View className="flex-row items-start gap-md">
        <View className="h-11 w-11 items-center justify-center rounded-md bg-surface-secondary">
          <IconSymbol name={categoryIcon} size={22} color="coral" />
        </View>

        <View className="flex-1 gap-xs">
          <View className="flex-row items-start justify-between gap-sm">
            <Text variant="headline" className="flex-1">
              {complaint.title}
            </Text>
            {badge ? <StatusPill tone={badge.tone} label={badge.label} /> : null}
          </View>

          <Text variant="body" color="textSecondary" numberOfLines={2}>
            {complaint.description}
          </Text>

          <View className="flex-row items-center justify-between">
            <Text variant="caption" color="textTertiary">
              {formatTicketNumber(complaint.id)}
            </Text>
            <Text variant="caption" color="textTertiary">
              {formatRelativeTime(complaint.created_at)}
            </Text>
          </View>
        </View>
      </View>

      <StatusTimeline status={complaint.status} compact />

      {actions && actions.length > 0 ? (
        <View className="flex-row flex-wrap gap-xs border-t border-border pt-sm">
          {actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={action.onPress}
              className="rounded-sm bg-surface-secondary px-md py-sm"
            >
              <Text variant="caption" color="coral">
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Card>
  );

  if (!onPress) return card;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.complaint', { title: complaint.title })}
    >
      {card}
    </Pressable>
  );
}
