import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SkeletonCard, Text } from '@/components';
import type { Tables } from '@/types/database';

import { LiveVisitorCard, LIVE_VISITOR_CARD_MIN_HEIGHT } from './LiveVisitorCard';

const GAP = 12;
const PEEK = 28;
const SCREEN_PADDING = 32;
const MAX_CARD_WIDTH = 300;

function pendingCardWidth(screenWidth: number) {
  const available = screenWidth - SCREEN_PADDING - PEEK;
  return Math.min(available, MAX_CARD_WIDTH);
}

interface Props {
  visitors?: Tables<'visitors'>[];
  loading?: boolean;
}

export function PendingVisitorsStrip({ visitors, loading }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = pendingCardWidth(width);

  if (loading) {
    return (
      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          {t('resident.approvals.pendingApproval')}
        </Text>
        <View style={{ width: cardWidth, minHeight: LIVE_VISITOR_CARD_MIN_HEIGHT }}>
          <SkeletonCard />
        </View>
      </View>
    );
  }

  if (!visitors?.length) return null;

  return (
    <View className="gap-sm">
      <Text variant="caption" color="textSecondary">
        {visitors.length === 1
          ? t('resident.approvals.pendingApproval')
          : t('resident.approvals.pendingApprovals', { count: visitors.length })}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        contentContainerStyle={{ gap: GAP, paddingRight: PEEK }}
      >
        {visitors.map((visitor) => (
          <LiveVisitorCard key={visitor.id} visitor={visitor} width={cardWidth} />
        ))}
      </ScrollView>
    </View>
  );
}
