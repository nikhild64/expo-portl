import { View } from 'react-native';

import { Avatar, Button, StatusPill, Text } from '@/components';
import { formatDateTime, formatFlatLabel, titleize } from '@/lib/format';
import type { VisitorLogRow } from '@/queries/useVisitorLog';

interface Props {
  loading?: boolean;
  onMarkExit: (visitorId: string) => void;
  visitor: VisitorLogRow;
}

export function LogRow({ loading, onMarkExit, visitor }: Props) {
  const stillInside = !!visitor.entered_at && !visitor.exited_at;
  const flatLabel = formatFlatLabel(visitor.flats?.towers?.name, visitor.flats?.number, 'Flat');

  return (
    <View className="flex-row gap-md border-b border-border bg-surface px-base py-md">
      <Avatar name={visitor.visitor_name} uri={visitor.visitor_photo_url ?? undefined} />
      <View className="flex-1 gap-xs">
        <View className="flex-row items-start justify-between gap-sm">
          <View className="flex-1">
            <Text variant="headline">{visitor.visitor_name}</Text>
            <Text variant="footnote" color="textSecondary">
              {titleize(visitor.type)} · {flatLabel}
            </Text>
          </View>
          <StatusPill tone={visitor.exited_at ? 'neutral' : stillInside ? 'success' : 'warning'} label={visitor.exited_at ? 'OUT' : stillInside ? 'IN' : titleize(visitor.status).toUpperCase()} />
        </View>

        <Text variant="caption" color="textTertiary">
          In: {formatDateTime(visitor.entered_at)} · Out: {formatDateTime(visitor.exited_at)}
        </Text>

        {stillInside && (
          <Button label="Mark exit" size="sm" variant="outlined" loading={loading} onPress={() => onMarkExit(visitor.id)} />
        )}
      </View>
    </View>
  );
}
