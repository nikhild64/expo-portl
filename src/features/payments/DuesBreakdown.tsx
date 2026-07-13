import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';

import { Card, IconSymbol, Text } from '@/components';
import { formatMoney, titleize } from '@/lib/format';
import type { Json, Tables } from '@/types/database';

interface LineItem {
  amount: number;
  label: string;
}

function parseLineItems(value: Json): LineItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, Json>;
      const label = String(record.label ?? record.name ?? record.type ?? 'Charge');
      const amount = Number(record.amount ?? 0);
      return { amount, label };
    })
    .filter((item): item is LineItem => !!item);
}

interface Props {
  due: Tables<'dues'> | null | undefined;
}

export function DuesBreakdown({ due }: Props) {
  const [expanded, setExpanded] = useState(true);
  const items = due ? parseLineItems(due.line_items) : [];

  if (!due) return null;

  return (
    <Card className="gap-md">
      <Pressable className="flex-row items-center justify-between" onPress={() => setExpanded((value) => !value)}>
        <Text variant="headline">This month&apos;s breakdown</Text>
        <IconSymbol name={expanded ? 'expand_less' : 'expand_more'} color="textSecondary" size={20} />
      </Pressable>
      {expanded && (
        <Animated.View entering={FadeInDown.duration(250)} exiting={FadeOutUp.duration(200)} layout={LinearTransition.duration(250)} className="gap-sm">
          {items.length ? (
            items.map((item) => (
              <View key={item.label} className="flex-row justify-between gap-md">
                <Text variant="body" color="textSecondary">
                  {titleize(item.label)}
                </Text>
                <Text variant="body">{formatMoney(item.amount)}</Text>
              </View>
            ))
          ) : (
            <Text variant="body" color="textSecondary">
              No line items available.
            </Text>
          )}
          <View className="flex-row justify-between border-t border-border pt-sm">
            <Text variant="headline">Total</Text>
            <Text variant="headline">{formatMoney(due.total)}</Text>
          </View>
        </Animated.View>
      )}
    </Card>
  );
}
