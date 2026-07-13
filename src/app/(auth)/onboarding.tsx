import { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, ScrollView, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconSymbol, Text } from '@/components';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors, type ThemeColor } from '@/theme';

const HERO_IMAGE = require('../../../assets/images/onboarding-society-hero.webp');

const SLIDES = [
  {
    title: 'Your society, in your pocket',
    sub: 'Approve visitors before they reach your door. Book amenities. Pay dues. All in one place.',
    notificationTitle: 'Visitor approved',
    notificationSub: 'Rahul Mehta • Flat B-1202',
    icon: 'check_circle',
    tone: 'success',
  },
  {
    title: 'Real-time gate control',
    sub: 'Guards raise, residents approve. Every visit tracked. Every entry logged.',
    notificationTitle: 'Gate entry logged',
    notificationSub: 'Amazon Delivery • Main Gate',
    icon: 'verified_user',
    tone: 'coral',
  },
  {
    title: 'Community made simple',
    sub: 'Notices, polls, complaints — the WhatsApp group, structured.',
    notificationTitle: 'New notice posted',
    notificationSub: 'Society AGM • Dec 15, 10 AM',
    icon: 'campaign',
    tone: 'info',
  },
] as const;

export default function Onboarding() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const setOnboarded = useAuthStore((s) => s.setOnboarded);

  const isLast = currentIndex === SLIDES.length - 1;
  const slide = SLIDES[currentIndex];
  const heroHeight = Math.min(height * 0.5, 410);
  const heroBg = colors.surfaceSecondary;

  const goToSlide = useCallback((index: number) => {
    const nextIndex = Math.max(0, Math.min(SLIDES.length - 1, index));
    setCurrentIndex(nextIndex);
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
  }, [width]);

  const contentSwipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 24 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -48) goToSlide(currentIndex + 1);
          if (gesture.dx > 48) goToSlide(currentIndex - 1);
        },
      }),
    [currentIndex, goToSlide],
  );

  const handleNext = async () => {
    if (!isLast) {
      goToSlide(currentIndex + 1);
      return;
    }

    await setOnboarded();
    router.replace('/(auth)/sign-in');
  };

  const handleSkip = async () => {
    await setOnboarded();
    router.push('/(auth)/sign-in');
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View style={{ height: heroHeight, backgroundColor: heroBg }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          className="flex-1"
        >
          {SLIDES.map((s) => (
            <View
              key={s.title}
              style={{
                width,
                height: heroHeight,
                backgroundColor: heroBg,
              }}
            >
              <Image
                source={HERO_IMAGE}
                style={{
                  width: '100%',
                  height: heroHeight,
                  borderBottomLeftRadius: 28,
                  borderBottomRightRadius: 28,
                  overflow: 'hidden',
                }}
                contentFit="cover"
                contentPosition="center"
                transition={180}
                accessibilityLabel="Illustration of a Portl residential society entrance"
              />
              <View
                pointerEvents="none"
                className="absolute inset-x-0 top-0 bg-bg/10"
                style={{
                  height: heroHeight,
                  borderBottomLeftRadius: 28,
                  borderBottomRightRadius: 28,
                }}
              />
              <NotificationCard
                title={s.notificationTitle}
                subtitle={s.notificationSub}
                icon={s.icon}
                tone={s.tone}
                colors={colors}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <View
        {...contentSwipe.panHandlers}
        className="-mt-7 flex-1 rounded-t-[30px] bg-bg px-lg pt-7"
        style={{ paddingBottom: Math.max(insets.bottom + 8, 24) }}
      >
        <View>
          <View className="mb-md flex-row gap-xs">
            {SLIDES.map((s, idx) => (
              <View
                key={s.title}
                className="h-2 rounded-sm"
                style={{
                  width: idx === currentIndex ? 24 : 8,
                  backgroundColor: idx === currentIndex ? colors.coral : colors.border,
                }}
              />
            ))}
          </View>

          <Text variant="titleLarge" className="mb-sm" numberOfLines={2}>
            {slide.title}
          </Text>
          <Text variant="body" color="textSecondary" numberOfLines={3}>
            {slide.sub}
          </Text>
        </View>

        <View className="min-h-5 flex-1" />

        <View>
          <View className="gap-sm">
            <Button
              label={isLast ? 'Get started' : 'Next'}
              onPress={handleNext}
              full
              icon="arrow_forward"
              iconPosition="right"
            />
            <Button
              label="I have an invite code"
              variant="outlined"
              onPress={handleSkip}
              full
            />
          </View>

          <Text variant="caption" color="textTertiary" className="mt-md text-center">
            By continuing you agree to our Terms and Privacy
          </Text>
        </View>
      </View>
    </View>
  );
}

function NotificationCard({
  title,
  subtitle,
  icon,
  tone,
  colors,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  tone: ThemeColor;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      className="absolute bottom-11 left-[30px] right-[30px] flex-row items-center gap-md rounded-lg border border-border bg-surface p-md shadow-elevation-md"
      style={{
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
        elevation: 8,
      }}
    >
      <View
        className="h-[38px] w-[38px] items-center justify-center rounded-pill"
        style={{
          backgroundColor: tone === 'success' ? colors.sageLight : colors.surfaceTertiary,
        }}
      >
        <IconSymbol name={icon} size={22} color={tone} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="subhead">{title}</Text>
        <Text variant="caption" color="textSecondary">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
