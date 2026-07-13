import { View } from 'react-native';
import { alert } from '@/lib/alert';
import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { Button, Card, IconSymbol, Screen, ScreenEmpty, ScreenLoading, StatusPill, Text } from '@/components';
import { PollDiscussion } from '@/features/polls/PollDiscussion';
import { PollOption } from '@/features/polls/PollOption';
import { PollResults } from '@/features/polls/PollResults';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import { useMyPollVote, usePoll, usePollComments, usePollVotes, useVotePoll } from '@/queries/usePolls';

function optionLabels(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options.map((option, index) => {
    if (typeof option === 'object' && option && 'label' in option) return String(option.label);
    return `Option ${index + 1}`;
  });
}

export default function PollDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: poll, isLoading, error } = usePoll(id);
  const { data: votes = [] } = usePollVotes(id);
  const { data: myVote } = useMyPollVote(id);
  const { data: comments = [] } = usePollComments(id);
  const vote = useVotePoll(id);
  const labels = useMemo(() => optionLabels(poll?.options), [poll?.options]);
  const [selected, setSelected] = useState<number[]>([]);
  const [hasVoted, setHasVoted] = useState(false);

  if (isLoading) return <ScreenLoading safe={false} />;

  if (error || !poll) {
    return <ScreenEmpty safe={false} icon="error_outline" title="Poll not found" subtitle="This poll may have closed or been removed." />;
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
      alert('Vote failed', submitError instanceof Error ? submitError.message : 'Please try again.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="gap-sm">
        <Text variant="caption" color="coral">
          ACTIVE POLL
        </Text>
        <Text variant="titleLarge">{poll.question}</Text>
        <Text variant="footnote" color="textSecondary">
          Started {formatRelativeTime(poll.starts_at)} · {votes.length} voted · {timeLeft}
        </Text>
        {!pollEnded && <StatusPill tone="warning" label={`Closes ${timeLeft}`} icon="schedule" />}
      </Card>

      {poll.anonymous && (
        <Card variant="outlined" className="flex-row gap-md">
          <IconSymbol name="groups" color="textSecondary" />
          <Text variant="footnote" color="textSecondary" className="flex-1">
            Voting is anonymous. Admins see only aggregate results.
          </Text>
        </Card>
      )}

      {!pollStarted && (
        <Card variant="outlined" className="gap-xs">
          <Text variant="headline">Poll not open yet</Text>
          <Text variant="body" color="textSecondary">
            Voting opens {formatDateTime(poll.starts_at)}.
          </Text>
        </Card>
      )}

      {pollStarted && !voted && !pollEnded && (
        <View className="gap-sm">
          {labels.map((label, index) => (
            <PollOption key={label} label={label} selected={selected.includes(index)} onPress={() => toggle(index)} />
          ))}
          <Button label="Submit vote" loading={vote.isPending} disabled={!selected.length} onPress={submit} />
        </View>
      )}

      {voted && !showResults && (
        <Card variant="outlined" className="gap-xs">
          <Text variant="headline">Thanks for voting</Text>
          <Text variant="body" color="textSecondary">
            Your response has been recorded. Results will be shared when the poll closes.
          </Text>
        </Card>
      )}

      {showResults && <PollResults labels={labels} votes={votes} myVote={effectiveVote} />}

      <PollDiscussion pollId={poll.id} comments={comments} />
    </Screen>
  );
}
