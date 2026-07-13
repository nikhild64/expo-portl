import { forwardRef, useImperativeHandle, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
              accessibilityLabel={expanded ? t('a11y.collapseDuesBreakdown') : t('a11y.expandDuesBreakdown')}
            >
              <Text variant="headline">
                {t('resident.payments.periodBreakdown', { period: formatDuesPeriod(due.period) })}
              </Text>
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
                    {t('resident.payments.noLineItems')}
                  </Text>
                )}
                <View className="flex-row justify-between border-t border-border pt-sm">
                  <Text variant="headline">{t('common.total')}</Text>
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
