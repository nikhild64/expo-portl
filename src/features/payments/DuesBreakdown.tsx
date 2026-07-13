import { forwardRef, useImperativeHandle, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';

import { IconSymbol, Text } from '@/components';
import { parseLineItems } from '@/features/payments/lineItems';
import { formatDuesPeriod, formatMoney, titleize } from '@/lib/format';
import type { Tables } from '@/types/database';

export type DuesBreakdownHandle = {
  expand: () => void;
};

interface Props {
  dues: Tables<'dues'>[];
}

export const DuesBreakdown = forwardRef<DuesBreakdownHandle, Props>(function DuesBreakdown({ dues }, ref) {
  const [expanded, setExpanded] = useState(true);

  useImperativeHandle(ref, () => ({
    expand: () => setExpanded(true),
  }));

  if (!dues.length) return null;

  return (
    <View className="gap-md">
      {dues.map((due) => {
        const items = parseLineItems(due.line_items);
        return (
          <View key={due.id} className="gap-md rounded-lg border border-border bg-surface p-base">
            <Pressable
              className="flex-row items-center justify-between"
              onPress={() => setExpanded((value) => !value)}
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Collapse dues breakdown' : 'Expand dues breakdown'}
            >
              <Text variant="headline">{formatDuesPeriod(due.period)} breakdown</Text>
              <IconSymbol name={expanded ? 'expand_less' : 'expand_more'} color="textSecondary" size={20} />
            </Pressable>
            {expanded && (
              <Animated.View
                entering={FadeInDown.duration(250)}
                exiting={FadeOutUp.duration(200)}
                layout={LinearTransition.duration(250)}
                className="gap-sm"
              >
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
          </View>
        );
      })}
    </View>
  );
});
