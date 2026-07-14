import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card, IconSymbol, Screen, ScreenEmpty, ScreenLoading, StatusPill, Text } from '@/components';
import { PollDiscussion } from '@/features/polls/PollDiscussion';
import { PollResults } from '@/features/polls/PollResults';
import { formatDateTime, formatRelativeTime, titleize } from '@/lib/format';
import { usePoll, usePollComments, usePollVotes } from '@/queries/usePolls';
import { useRealtimeTable } from '@/queries/useRealtimeTable';

function optionLabels(options: unknown, t: (key: string, options?: { number: number }) => string): string[] {
  if (!Array.isArray(options)) return [];
  return options.map((option, index) => {
    if (typeof option === 'object' && option && 'label' in option) return String(option.label);
    return t('resident.community.optionFallback', { number: index + 1 });
  });
}

export default function AdminPollDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: poll, isLoading, error } = usePoll(id);
  const { data: votes = [] } = usePollVotes(id);
  const { data: comments = [] } = usePollComments(id);
  const labels = useMemo(() => optionLabels(poll?.options, t), [poll?.options, t]);

  useRealtimeTable({
    enabled: !!id,
    filter: `poll_id=eq.${id}`,
    invalidateKeys: [['poll-votes', id], ['poll-comments', id]],
    table: 'poll_votes',
  });
  useRealtimeTable({
    enabled: !!id,
    filter: `poll_id=eq.${id}`,
    invalidateKeys: [['poll-comments', id]],
    table: 'poll_comments',
  });

  if (isLoading) return <ScreenLoading variant="tab" />;

  if (error || !poll) {
    return (
      <ScreenEmpty
        safe={false}
        icon="error_outline"
        title={t('resident.community.pollNotFound')}
        subtitle={t('resident.community.pollNotFoundSub')}
      />
    );
  }

  const pollEnded = new Date(poll.ends_at) < new Date();
  const pollStarted = new Date(poll.starts_at) <= new Date();
  const quorumMet = poll.quorum <= 0 || votes.length >= poll.quorum;

  return (
    <>
      <Stack.Screen
        options={{
          title: t('admin.community.pollResults'),
          headerLargeTitle: false,
          headerRight: () => (
            <Pressable
              onPress={() => router.push(`/(admin)/(community)/polls/${poll.id}/edit`)}
              accessibilityRole="button"
              accessibilityLabel={t('common.edit')}
              hitSlop={8}
              className="p-sm"
            >
              <IconSymbol name="edit" size={22} color="coral" />
            </Pressable>
          ),
        }}
      />
      <Screen scroll variant="tab">
        <Card className="gap-sm">
          <View className="flex-row flex-wrap items-center gap-sm">
            <StatusPill
              tone={pollEnded ? 'neutral' : pollStarted ? 'success' : 'warning'}
              label={pollEnded ? t('common.closed') : pollStarted ? t('common.active') : t('resident.community.pollNotOpen')}
            />
            <Text variant="caption" color="textSecondary">
              {titleize(poll.category)}
            </Text>
          </View>
          <Text variant="titleLarge">{poll.question}</Text>
          <Text variant="footnote" color="textSecondary">
            {t('admin.community.pollWindow', {
              start: formatDateTime(poll.starts_at),
              end: formatDateTime(poll.ends_at),
            })}
          </Text>
        </Card>

        <Card variant="outlined" className="gap-xs">
          <Text variant="headline">{t('admin.community.liveResults')}</Text>
          <Text variant="body" color="textSecondary">
            {t('admin.community.pollStats', {
              votes: votes.length,
              quorum: poll.quorum,
              timeLeft: formatRelativeTime(poll.ends_at),
            })}
          </Text>
          {poll.quorum > 0 && (
            <StatusPill
              tone={quorumMet ? 'success' : 'warning'}
              label={quorumMet ? t('admin.community.quorumMet') : t('admin.community.quorumPending')}
            />
          )}
        </Card>

        <PollResults labels={labels} votes={votes} />

        <PollDiscussion pollId={poll.id} comments={comments} />
      </Screen>
    </>
  );
}
