import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { Button, Card, Chip, EmptyState, Screen, Text } from '@/components';
import { VisitorListItem } from '@/features/visitors/VisitorListItem';
import { formatDateTime, titleize } from '@/lib/format';
import { useMyFlatIds } from '@/queries/useMe';
import { usePreApprovalsList, useVisitorsList } from '@/queries/useVisitors';

type Segment = 'pending' | 'expected' | 'history';

const segments: { label: string; value: Segment }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Expected', value: 'expected' },
  { label: 'History', value: 'history' },
];

export default function ApprovalsScreen() {
  const [segment, setSegment] = useState<Segment>('pending');
  const { data: flatIds } = useMyFlatIds();
  const { data: pending } = useVisitorsList(flatIds, 'pending');
  const { data: history } = useVisitorsList(flatIds, 'history');
  const { data: expected } = usePreApprovalsList(flatIds);

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {segments.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={segment === item.value}
            onPress={() => setSegment(item.value)}
          />
        ))}
      </ScrollView>

      <Button
        label="Pre-approve visitor"
        icon="qr_code"
        onPress={() => router.push('/(resident)/(approvals)/preapprove' as never)}
      />

      {segment === 'pending' && (
        <View className="gap-md">
          {pending?.length ? (
            pending.map((visitor) => (
              <VisitorListItem
                key={visitor.id}
                visitor={visitor}
                onPress={() => router.push(`/(resident)/(approvals)/${visitor.id}` as never)}
              />
            ))
          ) : (
            <EmptyState icon="inbox" title="No pending visitors" subtitle="Guard approval requests will appear here." />
          )}
        </View>
      )}

      {segment === 'expected' && (
        <View className="gap-md">
          {expected?.length ? (
            expected.map((preApproval) => (
              <Pressable
                key={preApproval.id}
                onPress={() => router.push(`/(resident)/(approvals)/preapprove/${preApproval.id}/qr` as never)}
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
            ))
          ) : (
            <EmptyState icon="qr_code" title="No expected visitors" subtitle="Pre-approved visitors will appear here." />
          )}
        </View>
      )}

      {segment === 'history' && (
        <View className="gap-md">
          {history?.length ? (
            history.map((visitor) => (
              <VisitorListItem
                key={visitor.id}
                visitor={visitor}
                onPress={() => router.push(`/(resident)/(approvals)/${visitor.id}` as never)}
              />
            ))
          ) : (
            <EmptyState icon="history" title="No visitor history" subtitle="Past visitors will appear after decisions." />
          )}
        </View>
      )}
    </Screen>
  );
}
