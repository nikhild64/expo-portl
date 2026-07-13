import { router, type Href } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';

import { Avatar, Button, Card, Text } from '@/components';
import { formatRelativeTime, titleize } from '@/lib/format';
import { useApproveVisitor, useRejectVisitor } from '@/queries/useVisitors';
import type { Tables } from '@/types/database';

interface Props {
  visitor: Tables<'visitors'>;
  width: number;
}

export const LIVE_VISITOR_CARD_MIN_HEIGHT = 168;

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
    <Card className="justify-between gap-md border-l-4 border-l-coral" style={{ width, minHeight: LIVE_VISITOR_CARD_MIN_HEIGHT }}>
      <Pressable
        onPress={openApproval}
        accessibilityRole="button"
        accessibilityLabel={`View ${visitor.visitor_name} approval request`}
        android_ripple={{ color: 'rgba(249,112,102,0.15)' }}
        className="flex-1 gap-sm"
      >
        <View className="flex-row items-center gap-xs">
          <View className="h-2 w-2 rounded-pill bg-coral" />
          <Text variant="caption" color="coral">
            AT GATE
          </Text>
        </View>


        <View className="flex-row items-center gap-md">
          <Avatar name={visitor.visitor_name} uri={visitor.visitor_photo_url ?? undefined} size="lg" />
          <View className="flex-1 gap-xs">
            <Text variant="headline" numberOfLines={1}>
              {visitor.visitor_name}
            </Text>
            <Text variant="subhead" color="textSecondary" numberOfLines={1}>
              {titleize(visitor.type)}
              {visitor.purpose ? ` · ${visitor.purpose}` : ''}
            </Text>
            <Text variant="footnote" color="textTertiary" numberOfLines={1}>
              {formatRelativeTime(visitor.requested_at)}
            </Text>
          </View>
        </View>
      </Pressable>

      <View className="flex-row gap-sm">
        <Button label="Reject" variant="outlined" size="sm" full loading={reject.isPending} onPress={() => decide('reject')} />
        <Button label="Approve" size="sm" full loading={approve.isPending} onPress={() => decide('approve')} />
      </View>
    </Card>
  );
}
