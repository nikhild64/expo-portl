import { View } from 'react-native';

import { Card, IconSymbol, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import type { Tables } from '@/types/database';

interface Props {
  preApproval: Tables<'pre_approvals'>;
}

export function ExpectedTodayCard({ preApproval }: Props) {
  return (
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
  );
}
