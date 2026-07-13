import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Button, Card, EmptyState, Screen, SegmentedControl, SkeletonRow, Text } from '@/components';
import { VisitorListItem } from '@/features/visitors/VisitorListItem';
import { canRevokePreApproval, confirmRevokePreApproval } from '@/features/visitors/revokePreApproval';
import { formatDateTime, titleize } from '@/lib/format';
import { useMyFlatIds } from '@/queries/useMe';
import { useRealtimeTable } from '@/queries/useRealtimeTable';
import { usePreApprovalsList, useRevokePreApproval, useVisitorsList } from '@/queries/useVisitors';
import { useAuthStore } from '@/stores/authStore';

type Segment = 'pending' | 'expected' | 'history';

const segments: { label: string; value: Segment }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Expected', value: 'expected' },
  { label: 'History', value: 'history' },
];

export default function ApprovalsScreen() {
  const [segment, setSegment] = useState<Segment>('pending');
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.session?.user.id);
  const revokePreApproval = useRevokePreApproval();
  const { data: flatIds, isLoading: flatIdsLoading } = useMyFlatIds();
  const pendingQuery = useVisitorsList(flatIds, 'pending');
  const historyQuery = useVisitorsList(flatIds, 'history');
  const expectedQuery = usePreApprovalsList(flatIds);
  const pending = pendingQuery.data;
  const history = historyQuery.data;
  const expected = expectedQuery.data;

  useRealtimeTable({
    enabled: !!societyId,
    filter: `society_id=eq.${societyId}`,
    invalidateKeys: [['visitors'], ['pre-approvals']],
    table: 'visitors',
  });

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <SegmentedControl segments={segments} value={segment} onChange={setSegment} />

      <Button
        label="Pre-approve visitor"
        icon="qr_code"
        onPress={() => router.push('/(resident)/(approvals)/preapprove' as Href)}
      />

      {segment === 'pending' && (
        <View className="gap-md">
          {flatIdsLoading || pendingQuery.isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : pending?.length ? (
            pending.map((visitor, index) => (
              <Animated.View
                key={visitor.id}
                entering={FadeInDown.delay(Math.min(index, 6) * 30).duration(200)}
                layout={LinearTransition}
              >
                <VisitorListItem
                  visitor={visitor}
                  onPress={() => router.push(`/(resident)/(approvals)/${visitor.id}` as Href)}
                />
              </Animated.View>
            ))
          ) : (
            <EmptyState icon="inbox" title="No pending visitors" subtitle="Guard approval requests will appear here." />
          )}
        </View>
      )}

      {segment === 'expected' && (
        <View className="gap-md">
          {flatIdsLoading || expectedQuery.isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : expected?.length ? (
            expected.map((preApproval, index) => (
              <Animated.View
                key={preApproval.id}
                entering={FadeInDown.delay(Math.min(index, 6) * 30).duration(200)}
                layout={LinearTransition}
              >
                <Pressable
                  onPress={() => router.push(`/(resident)/(approvals)/preapprove/${preApproval.id}/qr` as Href)}
                  onLongPress={
                    canRevokePreApproval(preApproval, userId, profile?.role)
                      ? () => confirmRevokePreApproval(preApproval, (id) => revokePreApproval.mutate(id))
                      : undefined
                  }
                >
                  <Card variant="outlined" className="gap-sm">
                    <View className="flex-row items-center justify-between gap-sm">
                      <Text variant="headline">{preApproval.visitor_name}</Text>
                      <Text variant="caption" color="coral">
                        {preApproval.code}
                      </Text>
                    </View>
                    <Text variant="footnote" color="textSecondary">
                      {titleize(preApproval.type)} - {formatDateTime(preApproval.start_at)} to {formatDateTime(preApproval.end_at)}
                    </Text>
                  </Card>
                </Pressable>
              </Animated.View>
            ))
          ) : (
            <EmptyState icon="qr_code" title="No expected visitors" subtitle="Pre-approved visitors will appear here." />
          )}
        </View>
      )}

      {segment === 'history' && (
        <View className="gap-md">
          {flatIdsLoading || historyQuery.isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : history?.length ? (
            history.map((visitor, index) => (
              <Animated.View
                key={visitor.id}
                entering={FadeInDown.delay(Math.min(index, 6) * 30).duration(200)}
                layout={LinearTransition}
              >
                <VisitorListItem
                  visitor={visitor}
                  onPress={() => router.push(`/(resident)/(approvals)/${visitor.id}` as Href)}
                />
              </Animated.View>
            ))
          ) : (
            <EmptyState icon="history" title="No visitor history" subtitle="Past visitors will appear after decisions." />
          )}
        </View>
      )}
    </Screen>
  );
}
