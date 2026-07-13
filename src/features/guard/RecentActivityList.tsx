import { View } from 'react-native';

import { Avatar, Card, StatusPill, Text } from '@/components';
import { formatDateTime, formatFlatLabel, titleize } from '@/lib/format';
import { VISITOR_PHOTOS_BUCKET } from '@/lib/storage';
import type { GuardActivityVisitor } from '@/queries/useGuardActivity';

interface Props {
  visitors?: GuardActivityVisitor[];
}

function statusFor(visitor: GuardActivityVisitor) {
  if (visitor.exited_at) return { label: 'OUT', tone: 'neutral' as const };
  if (visitor.entered_at || visitor.status === 'entered') return { label: 'IN', tone: 'success' as const };
  if (visitor.status === 'pending') return { label: 'PENDING', tone: 'warning' as const };
  if (visitor.status === 'rejected') return { label: 'REJECTED', tone: 'danger' as const };
  return { label: titleize(visitor.status).toUpperCase(), tone: 'info' as const };
}

export function RecentActivityList({ visitors }: Props) {
  if (!visitors?.length) {
    return (
      <Card variant="outlined" className="items-center gap-xs">
        <Text variant="headline">No gate activity yet</Text>
        <Text variant="footnote" color="textSecondary">
          New visitor entries will appear here.
        </Text>
      </Card>
    );
  }

  return (
    <View className="gap-sm">
      <Text variant="caption" color="textSecondary">
        RECENT ACTIVITY
      </Text>
      <Card padding="none" className="overflow-hidden">
        {visitors.map((visitor, index) => {
          const status = statusFor(visitor);
          const flatLabel = formatFlatLabel(visitor.flats?.towers?.name, visitor.flats?.number, 'Flat');
          const time = visitor.exited_at ?? visitor.entered_at ?? visitor.requested_at;

          return (
            <View
              key={visitor.id}
              className={`flex-row items-center gap-md px-base py-sm${index > 0 ? ' border-t border-border' : ''}`}
            >
              <Avatar name={visitor.visitor_name} storageBucket={VISITOR_PHOTOS_BUCKET} uri={visitor.visitor_photo_path ?? undefined} size="md" />
              <View className="flex-1">
                <Text variant="headline">{visitor.visitor_name}</Text>
                <Text variant="caption" color="textSecondary">
                  {status.label === 'OUT' ? 'Exited' : status.label === 'IN' ? 'Entered' : titleize(visitor.type)} · {flatLabel} ·{' '}
                  {formatDateTime(time)}
                </Text>
              </View>
              <StatusPill tone={status.tone} label={status.label} />
            </View>
          );
        })}
      </Card>
    </View>
  );
}
