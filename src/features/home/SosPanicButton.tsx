import { useEffect, useRef, useState } from 'react';
import { View, Pressable, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Card, IconSymbol, Text, Button } from '@/components';
import { useActiveSos, useTriggerSos, useCancelSos } from '@/queries/useSos';
import { useMyFlatIds } from '@/queries/useMe';

export function SosPanicButton() {
  const { t } = useTranslation();
  const { data: activeSos, isLoading } = useActiveSos();
  const triggerSos = useTriggerSos();
  const cancelSos = useCancelSos();
  const { data: flatIds } = useMyFlatIds();
  const primaryFlatId = flatIds?.[0] || null;

  const [isPressing, setIsPressing] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    setIsPressing(true);
    progressAnim.setValue(0);
    // Soft haptic warning on press start
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleTrigger();
      }
    });
  };

  const handlePressOut = () => {
    if (!triggerSos.isPending && !activeSos) {
      setIsPressing(false);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleTrigger = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    triggerSos.mutate({ flatId: primaryFlatId });
    setIsPressing(false);
    progressAnim.setValue(0);
  };

  const handleCancel = () => {
    if (activeSos) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      cancelSos.mutate(activeSos.id);
    }
  };

  // Interpolate progress width for a visual progress bar
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (isLoading) return null;

  if (activeSos) {
    const acknowledgedBy = (activeSos.resolved_by_profile as { full_name?: string } | null)?.full_name;

    return (
      <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20 gap-md">
        <View className="flex-row items-center gap-md">
          <View className="w-12 h-12 bg-red-500 rounded-full items-center justify-center animate-pulse">
            <IconSymbol name="warning" color="onPrimary" size={24} />
          </View>
          <View className="flex-1">
            <Text variant="headline" className="text-red-600 dark:text-red-400">
              {t('sos.activeTitle')}
            </Text>
            <Text variant="footnote" color="textSecondary">
              {acknowledgedBy 
                ? t('sos.acknowledgedBy', { guard: acknowledgedBy })
                : t('sos.notifying')}
            </Text>
          </View>
        </View>
        <Button
          label={t('sos.cancelButton')}
          variant="filled"
          className="bg-red-600"
          loading={cancelSos.isPending}
          onPress={handleCancel}
        />
      </Card>
    );
  }

  return (
    <Card className="gap-md relative overflow-hidden border border-red-200/50 dark:border-red-950/40">
      {/* Visual hold-to-confirm progress overlay */}
      <Animated.View 
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: progressWidth,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
        }}
      />
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-md">
          <Text variant="headline">{t('sos.cardTitle')}</Text>
          <Text variant="footnote" color="textSecondary">
            {isPressing 
              ? t('sos.pressingMsg')
              : t('sos.idleMsg')}
          </Text>
        </View>
        
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={t('sos.cardTitle')}
          className={`w-16 h-16 rounded-full items-center justify-center ${
            isPressing ? 'bg-red-700 scale-95' : 'bg-red-500'
          }`}
          style={{
            elevation: 4,
            shadowColor: '#ef4444',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
        >
          <IconSymbol name="notifications_active" color="onPrimary" size={32} />
        </Pressable>
      </View>
    </Card>
  );
}
