import { useCallback, useMemo, useState, type ReactElement } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCSSVariable } from 'uniwind';

import { Button, Card, EmptyState, Screen, SegmentedControl, SkeletonRow, Text } from '@/components';
import { MediumGapSeparator } from '@/components/listSeparators';
import { VisitorListItem } from '@/features/visitors/VisitorListItem';
import { canRevokePreApproval, confirmRevokePreApproval } from '@/features/visitors/revokePreApproval';
import { formatDateTime, titleize } from '@/lib/format';
import { signedUrlForPath, useSignedUrlMap, VISITOR_PHOTOS_BUCKET } from '@/lib/storage';
import { useMyFlatIds } from '@/queries/useMe';
import { useQueryRefresh } from '@/queries/useNotificationPreferences';
import { useRealtimeTable } from '@/queries/useRealtimeTable';
import { usePreApprovalsList, useRevokePreApproval, useVisitorsList } from '@/queries/useVisitors';
import { useVisitorListRealtime } from '@/queries/useVisitorListRealtime';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

type Segment = 'pending' | 'expected' | 'history';
type Visitor = Tables<'visitors'>;
type PreApproval = Tables<'pre_approvals'>;

export default function ApprovalsScreen() {
  const { t } = useTranslation();
  const coral = useCSSVariable('--color-coral') as string;
  const [segment, setSegment] = useState<Segment>('pending');
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.session?.user.id);
  const revokePreApproval = useRevokePreApproval();
  const { data: flatIds, isLoading: flatIdsLoading } = useMyFlatIds();
  const pendingQuery = useVisitorsList(flatIds, 'pending', { enabled: segment === 'pending' });
  const historyQuery = useVisitorsList(flatIds, 'history', { enabled: segment === 'history' });
  const expectedQuery = usePreApprovalsList(flatIds, { enabled: segment === 'expected' });
  const pending = pendingQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const expected = expectedQuery.data ?? [];

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

  const visitorRealtimeFilter =
    flatIds?.length === 1
      ? `flat_id=eq.${flatIds[0]}`
      : flatIds?.length
        ? `flat_id=in.(${flatIds.join(',')})`
        : undefined;

  useVisitorListRealtime(flatIds, !!societyId && !!flatIds?.length && segment !== 'expected');

  useRealtimeTable({
    enabled: !!societyId && !!flatIds?.length && segment === 'expected',
    filter: visitorRealtimeFilter,
    invalidateKeys: [['pre-approvals', flatIds]],
    table: 'pre_approvals',
  });

  const visitorPhotoPaths = useMemo(() => {
    const rows = segment === 'pending' ? pending : segment === 'history' ? history : [];
    return rows.map((visitor) => visitor.visitor_photo_path);
  }, [history, pending, segment]);

  const signedUrlMap = useSignedUrlMap(VISITOR_PHOTOS_BUCKET, visitorPhotoPaths);

  const listHeader = useMemo(
    () => (
      <View className="gap-md pb-md pt-sm">
        <SegmentedControl segments={segments} value={segment} onChange={setSegment} />
        <Button
          label={t('resident.approvals.preapproveVisitor')}
          icon="qr_code"
          onPress={() => router.push('/(resident)/(approvals)/preapprove')}
        />
      </View>
    ),
    [segment, segments, t],
  );

  const renderVisitor = useCallback(
    ({ item }: { item: Visitor }) => (
      <VisitorListItem
        visitor={item}
        imageUri={signedUrlForPath(signedUrlMap, item.visitor_photo_path, VISITOR_PHOTOS_BUCKET)}
        onPress={() => router.push({ pathname: '/(resident)/(approvals)/[id]', params: { id: item.id } })}
      />
    ),
    [signedUrlMap],
  );

  const renderExpected = useCallback(
    ({ item }: { item: PreApproval }) => (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(resident)/(approvals)/preapprove/[id]/qr',
            params: { id: item.id },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={t('a11y.viewQrFor', { name: item.visitor_name })}
        onLongPress={
          canRevokePreApproval(item, userId, profile?.role)
            ? () => confirmRevokePreApproval(item, (id) => revokePreApproval.mutate(id))
            : undefined
        }
      >
        <Card variant="outlined" className="gap-sm">
          <View className="flex-row items-center justify-between gap-sm">
            <Text variant="headline">{item.visitor_name}</Text>
            <Text variant="caption" color="coral">
              {item.code}
            </Text>
          </View>
          <Text variant="footnote" color="textSecondary">
            {titleize(item.type)} - {formatDateTime(item.start_at)} to {formatDateTime(item.end_at)}
          </Text>
        </Card>
      </Pressable>
    ),
    [profile?.role, revokePreApproval, t, userId],
  );

  const listData = segment === 'pending' ? pending : segment === 'history' ? history : expected;
  const isLoading =
    flatIdsLoading ||
    (segment === 'pending' && pendingQuery.isLoading) ||
    (segment === 'history' && historyQuery.isLoading) ||
    (segment === 'expected' && expectedQuery.isLoading);

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View className="gap-md">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      );
    }

    if (segment === 'pending') {
      return (
        <EmptyState
          icon="inbox"
          title={t('resident.approvals.noPendingVisitors')}
          subtitle={t('resident.approvals.noPendingVisitorsSub')}
        />
      );
    }
    if (segment === 'expected') {
      return (
        <EmptyState
          icon="qr_code"
          title={t('resident.approvals.noExpectedVisitors')}
          subtitle={t('resident.approvals.noExpectedVisitorsSub')}
        />
      );
    }
    return (
      <EmptyState
        icon="history"
        title={t('resident.approvals.noVisitorHistory')}
        subtitle={t('resident.approvals.noVisitorHistorySub')}
      />
    );
  }, [isLoading, segment, t]);

  const renderItem = segment === 'expected' ? renderExpected : renderVisitor;

  return (
    <Screen safe={false} padded={false}>
      <FlashList
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem as (info: { item: Visitor | PreApproval }) => ReactElement | null}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={MediumGapSeparator}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={coral} colors={[coral]} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
      />
    </Screen>
  );
}
