import { useMemo } from 'react';
import { View } from 'react-native';

import { Card, Text } from '@/components';
import type { Tables } from '@/types/database';

interface Props {
  labels: string[];
  myVote?: number[];
  votes: Tables<'poll_votes'>[];
}

export function PollResults({ labels, myVote = [], votes }: Props) {
  const total = Math.max(votes.length, 1);
  const counts = useMemo(
    () => labels.map((_label, index) => votes.filter((vote) => vote.option_indices.includes(index)).length),
    [labels, votes],
  );

  return (
    <Card className="gap-md">
      <Text variant="caption" color="textSecondary">
        RESULTS
      </Text>
      {labels.map((label, index) => {
        const count = counts[index] ?? 0;
        const percent = Math.round((count / total) * 100);
        const selected = myVote.includes(index);

        return (
          <View key={label} className="gap-xs">
            <View className="flex-row justify-between gap-sm">
              <Text variant="subhead" className="flex-1">
                {selected ? '[You] ' : ''}
                {label}
              </Text>
              <Text variant="subhead" color="textSecondary">
                {percent}%
              </Text>
            </View>
            <View className="h-2 rounded-pill bg-surface-secondary overflow-hidden">
              <View className="h-2 rounded-pill bg-coral" style={{ width: `${percent}%` }} />
            </View>
          </View>
        );
      })}
      <Text variant="caption" color="textTertiary">
        {votes.length} vote{votes.length === 1 ? '' : 's'}
      </Text>
    </Card>
  );
}
