import { Alert, Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { Avatar, Button, Card, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { useApproveVisitor, useRejectVisitor } from '@/queries/useVisitors';
import type { Tables } from '@/types/database';

interface Props {
  visitor: Tables<'visitors'>;
  width: number;
}

export const LIVE_VISITOR_CARD_MIN_HEIGHT = 152;

export function LiveVisitorCard({ visitor, width }: Props) {
  const approve = useApproveVisitor();
  const reject = useRejectVisitor();

  const openApproval = () => {
    router.push(`/(resident)/(home)/approvals/${visitor.id}` as Href);
  };

  const decide = async (action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await approve.mutateAsync({ id: visitor.id });
      else await reject.mutateAsync({ id: visitor.id });
    } catch (error) {
      Alert.alert('Could not update visitor', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Card className="justify-between gap-md" style={{ width, minHeight: LIVE_VISITOR_CARD_MIN_HEIGHT }}>
      <Pressable
        onPress={openApproval}
        accessibilityRole="button"
        accessibilityLabel={`View ${visitor.visitor_name} approval request`}
        android_ripple={{ color: 'rgba(249,112,102,0.15)' }}
        className="flex-1"
      >
        <View className="flex-row items-start gap-md">
          <Avatar name={visitor.visitor_name} uri={visitor.visitor_photo_url ?? undefined} size="lg" />
          <View className="flex-1 gap-xs">
            <View className="flex-row items-center justify-between gap-sm">
              <Text variant="headline" className="flex-1" numberOfLines={1}>
                {visitor.visitor_name}
              </Text>
              <StatusPill tone="warning" label="Waiting" />
            </View>
            <Text variant="subhead" color="textSecondary" numberOfLines={2}>
              {titleize(visitor.type)} {visitor.purpose ? `- ${visitor.purpose}` : ''}
            </Text>
            <Text variant="footnote" color="textTertiary" numberOfLines={1}>
              Requested {formatDateTime(visitor.requested_at)}
            </Text>
          </View>
        </View>
      </Pressable>

      <View className="flex-row gap-sm">
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
