import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { EmptyState, Screen, SkeletonCard } from '@/components';
import type { ComplaintCategoryFilter, ComplaintScope, ComplaintStatusFilter } from '@/features/complaints/constants';
import { useComplaintCounts, useComplaints } from '@/queries/useComplaints';
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
  const [statusFilter, setStatusFilter] = useState<ComplaintStatusFilter>('active');
  const [category, setCategory] = useState<ComplaintCategoryFilter>('all');

  const { data: counts } = useComplaintCounts(scope, societyId);
  const { data: complaints, isLoading } = useComplaints({ scope, statusFilter, category, societyId });

  const { refreshing, refresh } = useQueryRefresh([
    ['complaint-counts', scope],
    ['complaints', scope],
  ]);

  return (
    <View className="flex-1">
      <Screen
        scroll
        safe={false}
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: onRaiseTicket ? 120 : 96 }}
      >
        {counts ? <HelpdeskSummary active={counts.active} resolvedThisMonth={counts.resolvedThisMonth} /> : null}

        <HelpdeskFilters
          statusFilter={statusFilter}
          category={category}
          counts={counts}
          onStatusChange={setStatusFilter}
          onCategoryChange={setCategory}
        />

        <View className="gap-md">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : complaints?.length ? (
            complaints.map((complaint, index) => (
              <Animated.View
                key={complaint.id}
                entering={FadeInDown.delay(Math.min(index, 6) * 30).duration(200)}
                layout={LinearTransition}
              >
                <ComplaintCard complaint={complaint} onPress={() => onComplaintPress(complaint.id)} />
              </Animated.View>
            ))
          ) : (
            <EmptyState
              icon="construction"
              title="No tickets"
              subtitle={scope === 'mine' ? 'Raise a ticket when something needs attention.' : 'Tickets will appear here when residents raise them.'}
            />
          )}
        </View>
      </Screen>

      {onRaiseTicket ? <RaiseTicketFab onPress={onRaiseTicket} /> : null}
    </View>
  );
}
