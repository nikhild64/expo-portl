import { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

import { Button, Card, Field, IconSymbol, Text } from '@/components';
import { useSaveFrequentVisitor } from '@/queries/useFrequentVisitors';
import type { Database } from '@/types/database';

interface Props {
  visitorName: string;
  visitorPhone?: string | null;
  visitorType?: Database['public']['Enums']['visitor_type'];
  instructions: string;
  onInstructionsChange: (value: string) => void;
  onDone: () => void;
}

export function ApprovalSuccess({
  visitorName,
  visitorPhone,
  visitorType = 'guest',
  instructions,
  onInstructionsChange,
  onDone,
}: Props) {
  const { t } = useTranslation();
  const saveFrequentVisitor = useSaveFrequentVisitor();
  const sage = useCSSVariable('--color-sage') as string;
  const sageLight = useCSSVariable('--color-sage-light') as string;
  const scale = useSharedValue(0.3);
  const ringScale = useSharedValue(0.85);
  const ringOpacity = useSharedValue(0.45);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 100 });
    ringScale.value = withTiming(1.45, { duration: 650 });
    ringOpacity.value = withTiming(0, { duration: 650 });
  }, [ringOpacity, ringScale, scale]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const firstName = visitorName.split(' ')[0] ?? visitorName;

  return (
    <View className="flex-1 justify-center gap-lg p-base">
      <Animated.View entering={FadeInDown.duration(300)} className="items-center gap-lg">
        <View className="h-28 w-28 items-center justify-center">
          <Animated.View
            className="absolute h-24 w-24 rounded-pill"
            style={[{ backgroundColor: sageLight }, ringStyle]}
          />
          <Animated.View
            className="h-24 w-24 items-center justify-center rounded-pill"
            style={[{ backgroundColor: sageLight, borderColor: sage, borderWidth: 2 }, circleStyle]}
          >
            <IconSymbol name="check_circle" size={64} color="success" />
          </Animated.View>
        </View>

        <View className="items-center gap-xs">
          <Text variant="titleLarge">{t('resident.approval.approved')}</Text>
          <Text variant="body" color="textSecondary">
            {t('resident.approval.onTheirWayUp', { name: firstName })}
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(300)}>
        <Card className="gap-md">
          <View className="flex-row items-center justify-between gap-sm">
            <Text variant="headline">{t('resident.approval.instructionsToGuard')}</Text>
            <IconSymbol name="edit" size={18} color="textSecondary" />
          </View>
          <Field
            value={instructions}
            onChangeText={onInstructionsChange}
            placeholder={t('resident.approval.instructionsPlaceholder')}
            multiline
          />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(300)} className="gap-sm">
        {visitorPhone?.trim() ? (
          <Button
            label={t('resident.approval.addFrequentVisitor')}
            variant="outlined"
            icon="person_add"
            full
            loading={saveFrequentVisitor.isPending}
            onPress={() => {
              saveFrequentVisitor.mutate({
                visitor_name: visitorName,
                visitor_phone: visitorPhone,
                visitor_type: visitorType,
              });
            }}
          />
        ) : null}
        <Button label={t('common.done')} variant="text" onPress={onDone} full />
      </Animated.View>
    </View>
  );
}
