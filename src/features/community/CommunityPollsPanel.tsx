import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, Chip, EmptyState, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { usePolls } from '@/queries/usePolls';
import { useAuthStore } from '@/stores/authStore';

export function CommunityPollsPanel() {
  const { t } = useTranslation();
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
        <Chip label={t('resident.community.pollFilters.active')} selected={filter === 'active'} onPress={() => setFilter('active')} />
        <Chip label={t('resident.community.pollFilters.closed')} selected={filter === 'closed'} onPress={() => setFilter('closed')} />
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
              accessibilityLabel={poll.question}
            >
              <Card variant="outlined" className="gap-sm">
                <View className="flex-row items-center justify-between gap-sm">
                  <StatusPill tone={filter === 'active' ? 'success' : 'neutral'} label={t(`resident.community.pollFilters.${filter}`)} />
                  <Text variant="caption" color="textTertiary">
                    {t('resident.community.endsAt', { time: formatDateTime(poll.ends_at) })}
                  </Text>
                </View>
                <Text variant="headline">{poll.question}</Text>
                <Text variant="footnote" color="textSecondary">
                  {titleize(poll.category)} - {t('resident.community.quorum', { count: poll.quorum })}
                </Text>
              </Card>
            </Pressable>
          ))
        ) : (
          <EmptyState icon="poll" title={t('resident.community.noPolls')} subtitle={t('resident.community.noPollsSub')} />
        )}
      </View>
    </>
  );
}
