import { useRef, useState } from 'react';
import { View, Pressable, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Card, IconSymbol, Text } from '@/components';
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

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (isLoading) return null;

  // ── Active state ──────────────────────────────────────────
  if (activeSos) {
    const acknowledgedBy = (activeSos.resolved_by_profile as { full_name?: string } | null)?.full_name;

    return (
      <Card className="border border-red-500/60 bg-red-50 dark:bg-red-950/20 py-sm px-md">
        <View className="flex-row items-center gap-sm">
          {/* Pulsing dot */}
          <View className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />

          <View className="flex-1">
            <Text variant="subhead" className="text-red-600 dark:text-red-400">
              {t('sos.activeTitle')}
            </Text>
            <Text variant="caption" color="textSecondary">
              {acknowledgedBy
                ? t('sos.acknowledgedBy', { guard: acknowledgedBy })
                : t('sos.notifying')}
            </Text>
          </View>

          {/* Inline cancel — no full-width button row */}
          <Pressable
            onPress={handleCancel}
            disabled={cancelSos.isPending}
            accessibilityRole="button"
            accessibilityLabel={t('sos.cancelButton')}
            className="px-sm py-xs rounded-lg border border-red-500/60 bg-red-100 dark:bg-red-900/40"
          >
            <Text variant="caption" className="text-red-600 dark:text-red-400 font-semibold">
              {cancelSos.isPending ? '…' : t('sos.cancelButton')}
            </Text>
          </Pressable>
        </View>
      </Card>
    );
  }

  // ── Idle state ────────────────────────────────────────────
  return (
    <Card className="relative overflow-hidden border border-red-200/40 dark:border-red-900/30 py-sm px-md">
      {/* Hold-progress fill */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: progressWidth,
          backgroundColor: isPressing ? 'rgba(239, 68, 68, 0.14)' : 'rgba(239, 68, 68, 0.07)',
        }}
      />

      <View className="flex-row items-center gap-md">
        {/* Text */}
        <View className="flex-1">
          <Text variant="subhead">{t('sos.cardTitle')}</Text>
          <Text variant="caption" color="textSecondary">
            {isPressing ? t('sos.pressingMsg') : t('sos.idleMsg')}
          </Text>
        </View>

        {/* Hold button — 48px, tighter than before */}
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={t('sos.cardTitle')}
          className={`w-12 h-12 rounded-full items-center justify-center ${
            isPressing ? 'bg-red-700' : 'bg-red-500'
          }`}
          style={{
            elevation: isPressing ? 2 : 6,
            shadowColor: '#ef4444',
            shadowOffset: { width: 0, height: isPressing ? 1 : 3 },
            shadowOpacity: isPressing ? 0.2 : 0.4,
            shadowRadius: isPressing ? 2 : 8,
            transform: [{ scale: isPressing ? 0.93 : 1 }],
          }}
        >
          <IconSymbol name="notifications_active" color="onPrimary" size={22} />
        </Pressable>
      </View>
    </Card>
  );
}
