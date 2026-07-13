import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';

import { Card, IconSymbol, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
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
        <Card className="w-[220px] gap-sm">
          <View className="flex-row items-center justify-between gap-sm">
            <IconSymbol name="qr_code" color="coral" />
            <StatusPill tone="info" label={titleize(preApproval.type)} />
          </View>
          <View>
            <Text variant="headline">{preApproval.visitor_name}</Text>
            <Text variant="footnote" color="textSecondary">
              {formatDateTime(preApproval.start_at)}
            </Text>
          </View>
          <Text variant="caption" color="textTertiary">
            Code {preApproval.code}
          </Text>
        </Card>
      </Pressable>
    </Link>
  );
}
