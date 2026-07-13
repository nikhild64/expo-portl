import { Alert, View } from 'react-native';
import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { Button, Card, Screen, ScreenEmpty, ScreenLoading, Text } from '@/components';
import { PollDiscussion } from '@/features/polls/PollDiscussion';
import { PollOption } from '@/features/polls/PollOption';
import { PollResults } from '@/features/polls/PollResults';
import { formatDateTime } from '@/lib/format';
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

  if (isLoading) return <ScreenLoading safe={false} />;

  if (error || !poll) {
    return <ScreenEmpty safe={false} icon="error_outline" title="Poll not found" subtitle="This poll may have closed or been removed." />;
  }

  const effectiveVote = myVote?.option_indices ?? selected;
  const showResults = !!myVote || poll.show_results || new Date(poll.ends_at) < new Date();

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
    } catch (submitError) {
      Alert.alert('Vote failed', submitError instanceof Error ? submitError.message : 'Please try again.');
    }
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="gap-sm">
        <Text variant="caption" color="textSecondary">
          ENDS {formatDateTime(poll.ends_at)}
        </Text>
        <Text variant="titleLarge">{poll.question}</Text>
        <Text variant="footnote" color="textSecondary">
          {poll.allow_multiple ? 'Choose one or more options' : 'Choose one option'}
        </Text>
      </Card>

      {!showResults && (
        <View className="gap-sm">
          {labels.map((label, index) => (
            <PollOption key={label} label={label} selected={selected.includes(index)} onPress={() => toggle(index)} />
          ))}
          <Button label="Submit vote" loading={vote.isPending} disabled={!selected.length} onPress={submit} />
        </View>
      )}

      {showResults && <PollResults labels={labels} votes={votes} myVote={effectiveVote} />}

      <PollDiscussion pollId={poll.id} comments={comments} />
    </Screen>
  );
}
