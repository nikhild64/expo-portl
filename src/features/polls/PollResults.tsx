import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const total = Math.max(votes.length, 1);
  const counts = useMemo(() => {
    const tallies = Array.from({ length: labels.length }, () => 0);
    for (const vote of votes) {
      for (const index of vote.option_indices) {
        if (index >= 0 && index < tallies.length) tallies[index] += 1;
      }
    }
    return tallies;
  }, [labels.length, votes]);

  return (
    <Card className="gap-md">
      <Text variant="caption" color="coral">
        {t('resident.community.pollActive')}
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
        {t('resident.community.voteCount', { count: votes.length })}
      </Text>
    </Card>
  );
}
