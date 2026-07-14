import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, SkeletonCard } from '@/components';
import { MediumGapSeparator } from '@/components/listSeparators';
import type { ComplaintCategoryFilter, ComplaintScope, ComplaintStatusFilter } from '@/features/complaints/constants';
import {
  flattenComplaintPages,
  useComplaintCounts,
  useComplaints,
  type ComplaintWithFlat,
} from '@/queries/useComplaints';
import { useQueryRefresh } from '@/queries/useNotificationPreferences';

import { ComplaintCard } from './ComplaintCard';
import { HelpdeskFilters } from './HelpdeskFilters';
import { HelpdeskSummary } from './HelpdeskSummary';
import { RaiseTicketFab } from './RaiseTicketFab';

interface Props {
  scope: ComplaintScope;
  societyId?: string | null;
  onComplaintPress: (id: string) => void;
  onRaiseTicket?: () => void;
}

export function HelpdeskList({ scope, societyId, onComplaintPress, onRaiseTicket }: Props) {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<ComplaintStatusFilter>('active');
  const [category, setCategory] = useState<ComplaintCategoryFilter>('all');

  const { data: counts } = useComplaintCounts(scope, societyId);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, isRefetching } = useComplaints({
    scope,
    statusFilter,
    category,
    societyId,
  });
  const complaints = flattenComplaintPages(data?.pages);

  const { refreshing, refresh } = useQueryRefresh([
    ['complaint-counts', scope],
    ['complaints', scope],
  ]);

  const listHeader = useMemo(
    () => (
      <View className="gap-md pb-md pt-sm">
        {counts ? <HelpdeskSummary active={counts.active} resolvedThisMonth={counts.resolvedThisMonth} /> : null}
        <HelpdeskFilters
          statusFilter={statusFilter}
          category={category}
          counts={counts}
          onStatusChange={setStatusFilter}
          onCategoryChange={setCategory}
        />
      </View>
    ),
    [category, counts, statusFilter],
  );

  const listFooter = useMemo(
    () =>
      hasNextPage ? (
        <Button
          label={t('common.loadMore')}
          variant="outlined"
          loading={isFetchingNextPage}
          onPress={() => fetchNextPage()}
          className="mt-md"
        />
      ) : null,
    [fetchNextPage, hasNextPage, isFetchingNextPage, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: ComplaintWithFlat }) => (
      <ComplaintCard complaint={item} onPress={() => onComplaintPress(item.id)} />
    ),
    [onComplaintPress],
  );

  const listEmpty = useMemo(
    () => (
      <EmptyState
        icon="construction"
        title={t('resident.complaints.noTickets')}
        subtitle={
          scope === 'mine' ? t('resident.complaints.noTicketsMine') : t('resident.complaints.noTicketsAdmin')
        }
      />
    ),
    [scope, t],
  );

  if (isLoading) {
    return (
      <View className="flex-1 px-base pt-sm">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlashList
        key={`${scope}-${statusFilter}-${category}`}
        data={complaints}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={MediumGapSeparator}
        onRefresh={refresh}
        refreshing={refreshing || isRefetching}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: onRaiseTicket ? 120 : 96 }}
      />
      {onRaiseTicket ? <RaiseTicketFab onPress={onRaiseTicket} /> : null}
    </View>
  );
}
