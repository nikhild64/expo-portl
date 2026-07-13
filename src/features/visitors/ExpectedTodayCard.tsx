import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';

import { Avatar, Card, IconSymbol, StatusPill, Text } from '@/components';
import { formatTimeRange, titleize } from '@/lib/format';
import type { Tables } from '@/types/database';

interface Props {
  preApproval: Tables<'pre_approvals'>;
  onRevoke?: () => void;
}

export function ExpectedTodayCard({ preApproval, onRevoke }: Props) {
  return (
    <Link href={`/(resident)/(home)/preapprove/${preApproval.id}/qr`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View QR for ${preApproval.visitor_name}`}
        accessibilityHint={onRevoke ? 'Long press to revoke pre-approval' : undefined}
        onLongPress={onRevoke}
        android_ripple={{ color: 'rgba(249,112,102,0.15)' }}
      >
        <Card className="w-[200px] gap-sm">
          <View className="flex-row items-center gap-md">
            <Avatar name={preApproval.visitor_name} size="md" />
            <View className="flex-1 gap-xs">
              <Text variant="headline" numberOfLines={1}>
                {preApproval.visitor_name.split(' ')[0]}
              </Text>
              <Text variant="footnote" color="textSecondary" numberOfLines={1}>
                {titleize(preApproval.type)} · {formatTimeRange(preApproval.start_at, preApproval.end_at)}
              </Text>
            </View>
            <IconSymbol name="qr_code" color="coral" size={20} />
          </View>
          <StatusPill tone="info" label={titleize(preApproval.type)} />
        </Card>
      </Pressable>
    </Link>
  );
}
