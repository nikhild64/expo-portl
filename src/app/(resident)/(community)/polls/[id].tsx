import { View } from 'react-native';
import { alert } from '@/lib/alert';
import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, IconSymbol, Screen, ScreenEmpty, ScreenLoading, StatusPill, Text } from '@/components';
import { PollDiscussion } from '@/features/polls/PollDiscussion';
import { PollOption } from '@/features/polls/PollOption';
import { PollResults } from '@/features/polls/PollResults';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import { useMyPollVote, usePoll, usePollComments, usePollVotes, useVotePoll } from '@/queries/usePolls';

function optionLabels(options: unknown, t: (key: string, options?: { number: number }) => string): string[] {
  if (!Array.isArray(options)) return [];
  return options.map((option, index) => {
    if (typeof option === 'object' && option && 'label' in option) return String(option.label);
    return t('resident.community.optionFallback', { number: index + 1 });
  });
}

export default function PollDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: poll, isLoading, error } = usePoll(id);
  const { data: votes = [] } = usePollVotes(id);
  const { data: myVote } = useMyPollVote(id);
  const { data: comments = [] } = usePollComments(id);
  const vote = useVotePoll(id);
  const labels = useMemo(() => optionLabels(poll?.options, t), [poll?.options, t]);
  const [selected, setSelected] = useState<number[]>([]);
  const [hasVoted, setHasVoted] = useState(false);

  if (isLoading) return <ScreenLoading safe={false} />;

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

  const voted = hasVoted || !!myVote;
  const pollEnded = new Date(poll.ends_at) < new Date();
  const pollStarted = new Date(poll.starts_at) <= new Date();
  const showResults = pollEnded || (voted && poll.show_results);
  const effectiveVote = myVote?.option_indices ?? selected;
  const timeLeft = formatRelativeTime(poll.ends_at);

  const toggle = (index: number) => {
    if (poll.allow_multiple) {
      setSelected((current) => (current.includes(index) ? current.filter((item) => item !== index) : [...current, index]));
    } else {
      setSelected([index]);
    }
  };

  const submit = async () => {
    if (!selected.length) return;
    try {
      await vote.mutateAsync(selected);
      setHasVoted(true);
    } catch (submitError) {
      alert(
        t('alert.titles.voteFailed'),
        submitError instanceof Error ? submitError.message : t('common.pleaseTryAgain'),
      );
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="gap-sm">
        <Text variant="caption" color="coral">
          {t('resident.community.pollActive')}
        </Text>
        <Text variant="titleLarge">{poll.question}</Text>
        <Text variant="footnote" color="textSecondary">
          {t('resident.community.pollMeta', {
            time: formatRelativeTime(poll.starts_at),
            count: votes.length,
            timeLeft,
          })}
        </Text>
        {!pollEnded && <StatusPill tone="warning" label={t('common.closesIn', { time: timeLeft })} icon="schedule" />}
      </Card>

      {poll.anonymous && (
        <Card variant="outlined" className="flex-row gap-md">
          <IconSymbol name="groups" color="textSecondary" />
          <Text variant="footnote" color="textSecondary" className="flex-1">
            {t('resident.community.votingAnonymous')}
          </Text>
        </Card>
      )}

      {!pollStarted && (
        <Card variant="outlined" className="gap-xs">
          <Text variant="headline">{t('resident.community.pollNotOpen')}</Text>
          <Text variant="body" color="textSecondary">
            {t('resident.community.votingOpens', { datetime: formatDateTime(poll.starts_at) })}
          </Text>
        </Card>
      )}

      {pollStarted && !voted && !pollEnded && (
        <View className="gap-sm">
          {labels.map((label, index) => (
            <PollOption key={label} label={label} selected={selected.includes(index)} onPress={() => toggle(index)} />
          ))}
          <Button label={t('resident.community.submitVote')} loading={vote.isPending} disabled={!selected.length} onPress={submit} />
        </View>
      )}

      {voted && !showResults && (
        <Card variant="outlined" className="gap-xs">
          <Text variant="headline">{t('resident.community.thanksForVoting')}</Text>
          <Text variant="body" color="textSecondary">
            {t('resident.community.votingRecorded')}
          </Text>
        </Card>
      )}

      {showResults && <PollResults labels={labels} votes={votes} myVote={effectiveVote} />}

      <PollDiscussion pollId={poll.id} comments={comments} />
    </Screen>
  );
}
