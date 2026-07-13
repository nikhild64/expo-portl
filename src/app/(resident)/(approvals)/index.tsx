import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Button, Card, EmptyState, Screen, SegmentedControl, SkeletonRow, Text } from '@/components';
import { VisitorListItem } from '@/features/visitors/VisitorListItem';
import { canRevokePreApproval, confirmRevokePreApproval } from '@/features/visitors/revokePreApproval';
import { formatDateTime, titleize } from '@/lib/format';
import { useMyFlatIds } from '@/queries/useMe';
import { useRealtimeTable } from '@/queries/useRealtimeTable';
import { usePreApprovalsList, useRevokePreApproval, useVisitorsList } from '@/queries/useVisitors';
import { useQueryRefresh } from '@/queries/useNotificationPreferences';
import { useAuthStore } from '@/stores/authStore';

type Segment = 'pending' | 'expected' | 'history';

export default function ApprovalsScreen() {
  const { t } = useTranslation();
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

  const segments = useMemo(
    () => [
      { label: t('resident.approvals.pending'), value: 'pending' as const },
      { label: t('resident.approvals.expected'), value: 'expected' as const },
      { label: t('resident.approvals.history'), value: 'history' as const },
    ],
    [t],
  );

  const { refreshing, refresh } = useQueryRefresh([
    ['visitors'],
    ['pre-approvals'],
    ['me', 'flat-ids'],
  ]);

  useRealtimeTable({
    enabled: !!societyId,
    filter: `society_id=eq.${societyId}`,
    invalidateKeys: [['visitors'], ['pre-approvals']],
    table: 'visitors',
  });

  return (
    <Screen scroll safe={false} refreshing={refreshing} onRefresh={refresh} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <SegmentedControl segments={segments} value={segment} onChange={setSegment} />

      <Button
        label={t('resident.approvals.preapproveVisitor')}
        icon="qr_code"
        onPress={() => router.push('/(resident)/(approvals)/preapprove')}
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
                  onPress={() => router.push({ pathname: '/(resident)/(approvals)/[id]', params: { id: visitor.id } })}
                />
              </Animated.View>
            ))
          ) : (
            <EmptyState
              icon="inbox"
              title={t('resident.approvals.noPendingVisitors')}
              subtitle={t('resident.approvals.noPendingVisitorsSub')}
            />
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
                  onPress={() =>
                    router.push({
                      pathname: '/(resident)/(approvals)/preapprove/[id]/qr',
                      params: { id: preApproval.id },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={t('a11y.viewQrFor', { name: preApproval.visitor_name })}
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
            <EmptyState
              icon="qr_code"
              title={t('resident.approvals.noExpectedVisitors')}
              subtitle={t('resident.approvals.noExpectedVisitorsSub')}
            />
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
                  onPress={() => router.push({ pathname: '/(resident)/(approvals)/[id]', params: { id: visitor.id } })}
                />
              </Animated.View>
            ))
          ) : (
            <EmptyState
              icon="history"
              title={t('resident.approvals.noVisitorHistory')}
              subtitle={t('resident.approvals.noVisitorHistorySub')}
            />
          )}
        </View>
      )}
    </Screen>
  );
}
