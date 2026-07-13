import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { Card, Chip, EmptyState, Screen, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { usePolls } from '@/queries/usePolls';
import { useAuthStore } from '@/stores/authStore';

export default function PollsScreen() {
  const [filter, setFilter] = useState<'active' | 'closed'>('active');
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: polls, isLoading } = usePolls(societyId, filter);

  if (isLoading) {
    return (
      <Screen safe={false}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97066" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <View className="flex-row gap-sm">
        <Chip label="Active" selected={filter === 'active'} onPress={() => setFilter('active')} />
        <Chip label="Closed" selected={filter === 'closed'} onPress={() => setFilter('closed')} />
      </View>

      <View className="gap-md">
        {polls?.length ? (
          polls.map((poll) => (
            <Pressable key={poll.id} onPress={() => router.push(`/(resident)/(community)/polls/${poll.id}` as Href)}>
              <Card variant="outlined" className="gap-sm">
                <View className="flex-row items-center justify-between gap-sm">
                  <StatusPill tone={filter === 'active' ? 'success' : 'neutral'} label={titleize(filter)} />
                  <Text variant="caption" color="textTertiary">
                    Ends {formatDateTime(poll.ends_at)}
                  </Text>
                </View>
                <Text variant="headline">{poll.question}</Text>
                <Text variant="footnote" color="textSecondary">
                  {titleize(poll.category)} - quorum {poll.quorum}
                </Text>
              </Card>
            </Pressable>
          ))
        ) : (
          <EmptyState icon="poll" title="No polls" subtitle="Society polls will appear here." />
        )}
      </View>
    </Screen>
  );
}
