import { Alert, View } from 'react-native';
import { router } from 'expo-router';

import { Avatar, Button, Card, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { useApproveVisitor, useRejectVisitor } from '@/queries/useVisitors';
import type { Tables } from '@/types/database';

interface Props {
  visitor: Tables<'visitors'>;
}

export function LiveVisitorCard({ visitor }: Props) {
  const approve = useApproveVisitor();
  const reject = useRejectVisitor();

  const decide = async (action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await approve.mutateAsync({ id: visitor.id });
      else await reject.mutateAsync({ id: visitor.id });
    } catch (error) {
      Alert.alert('Could not update visitor', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Card className="gap-md">
      <View className="flex-row items-start gap-md">
        <Avatar name={visitor.visitor_name} uri={visitor.visitor_photo_url ?? undefined} size="lg" />
        <View className="flex-1 gap-xs">
          <View className="flex-row items-center justify-between gap-sm">
            <Text variant="headline" className="flex-1">
              {visitor.visitor_name}
            </Text>
            <StatusPill tone="warning" label="Waiting" />
          </View>
          <Text variant="subhead" color="textSecondary">
            {titleize(visitor.type)} {visitor.purpose ? `- ${visitor.purpose}` : ''}
          </Text>
          <Text variant="footnote" color="textTertiary">
            Requested {formatDateTime(visitor.requested_at)}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-sm">
        <Button
          label="View"
          variant="outlined"
          size="sm"
          full
          onPress={() => router.push(`/(resident)/(approvals)/${visitor.id}` as never)}
        />
        <Button
          label="Reject"
          variant="danger"
          size="sm"
          full
          loading={reject.isPending}
          onPress={() => decide('reject')}
        />
        <Button
          label="Approve"
          size="sm"
          full
          loading={approve.isPending}
          onPress={() => decide('approve')}
        />
      </View>
    </Card>
  );
}
