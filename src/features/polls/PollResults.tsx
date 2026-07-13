import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Card, Text } from '@/components';
import type { Tables } from '@/types/database';

interface Props {
  labels: string[];
  myVote?: number[];
  votes: Tables<'poll_votes'>[];
}

function AnimatedBar({ percent }: { percent: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(percent, { duration: 500 });
  }, [percent, width]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View className="h-2 overflow-hidden rounded-pill bg-surface-secondary">
      <Animated.View className="h-2 rounded-pill bg-coral" style={barStyle} />
    </View>
  );
}

export function PollResults({ labels, myVote = [], votes }: Props) {
  const total = Math.max(votes.length, 1);
  const counts = useMemo(
    () => labels.map((_label, index) => votes.filter((vote) => vote.option_indices.includes(index)).length),
    [labels, votes],
  );

  return (
    <Card className="gap-md">
      <Text variant="caption" color="coral">
        ACTIVE POLL
      </Text>
      {labels.map((label, index) => {
        const count = counts[index] ?? 0;
        const percent = Math.round((count / total) * 100);
        const selected = myVote.includes(index);

        return (
          <View key={label} className="gap-xs">
            <View className="flex-row justify-between gap-sm">
              <Text variant="subhead" className="flex-1" color={selected ? 'coral' : 'textPrimary'}>
                {label}
              </Text>
              <Text variant="subhead" color="textSecondary">
                {percent}% · {count}
              </Text>
            </View>
            <AnimatedBar percent={percent} />
          </View>
        );
      })}
      <Text variant="caption" color="textTertiary">
        {votes.length} vote{votes.length === 1 ? '' : 's'}
      </Text>
    </Card>
  );
}
