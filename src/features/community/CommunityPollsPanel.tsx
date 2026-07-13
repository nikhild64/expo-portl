import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { Card, Chip, EmptyState, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { usePolls } from '@/queries/usePolls';
import { useAuthStore } from '@/stores/authStore';

export function CommunityPollsPanel() {
  const [filter, setFilter] = useState<'active' | 'closed'>('active');
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: polls, isLoading } = usePolls(societyId, filter);

  if (isLoading) {
    return (
      <View className="items-center py-xl">
        <ActivityIndicator size="large" colorClassName="accent-coral" />
      </View>
    );
  }

  return (
    <>
      <View className="flex-row gap-sm">
        <Chip label="Active" selected={filter === 'active'} onPress={() => setFilter('active')} />
        <Chip label="Closed" selected={filter === 'closed'} onPress={() => setFilter('closed')} />
      </View>

      <View className="gap-md">
        {polls?.length ? (
          polls.map((poll) => (
            <Pressable
              key={poll.id}
              onPress={() =>
                router.push({ pathname: '/(resident)/(community)/polls/[id]', params: { id: poll.id } })
              }
              accessibilityRole="button"
              accessibilityLabel={`Open poll ${poll.question}`}
            >
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
    </>
  );
}
