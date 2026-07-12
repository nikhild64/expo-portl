import { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, ScrollView, View, useColorScheme, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconSymbol, Text } from '@/components';
import { useAuthStore } from '@/stores/authStore';
import { darkColors, lightColors, type ThemeColor } from '@/theme';

type ThemeColors = Record<ThemeColor, string>;

const HERO_IMAGE = require('../../../assets/images/onboarding-society-hero.png');

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
  const colorScheme = useColorScheme();
  const colors: ThemeColors = colorScheme === 'dark' ? darkColors : lightColors;
  const isDark = colorScheme === 'dark';

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const setOnboarded = useAuthStore((s) => s.setOnboarded);

  const isLast = currentIndex === SLIDES.length - 1;
  const slide = SLIDES[currentIndex];
  const heroHeight = Math.min(height * 0.5, 410);

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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ height: heroHeight, backgroundColor: isDark ? '#17100E' : '#FFF2EE' }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          style={{ flex: 1 }}
        >
          {SLIDES.map((s) => (
            <View
              key={s.title}
              style={{
                width,
                height: heroHeight,
                backgroundColor: isDark ? '#17100E' : '#FFF2EE',
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
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: heroHeight,
                  borderBottomLeftRadius: 28,
                  borderBottomRightRadius: 28,
                  backgroundColor: isDark ? 'rgba(26,20,18,0.12)' : 'transparent',
                }}
              />
              <NotificationCard
                title={s.notificationTitle}
                subtitle={s.notificationSub}
                icon={s.icon}
                tone={s.tone}
                colors={colors}
                isDark={isDark}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      <View
        {...contentSwipe.panHandlers}
        style={{
          flex: 1,
          marginTop: -28,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          backgroundColor: colors.bg,
          paddingHorizontal: 24,
          paddingTop: 28,
          paddingBottom: Math.max(insets.bottom + 8, 24),
        }}
      >
        <View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
            {SLIDES.map((s, idx) => (
              <View
                key={s.title}
                style={{
                  width: idx === currentIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: idx === currentIndex ? colors.coral : colors.border,
                }}
              />
            ))}
          </View>

          <Text variant="titleLarge" style={{ marginBottom: 10 }} numberOfLines={2}>
            {slide.title}
          </Text>
          <Text variant="body" color="textSecondary" numberOfLines={3}>
            {slide.sub}
          </Text>
        </View>

        <View style={{ flex: 1, minHeight: 20 }} />

        <View>
          <View style={{ gap: 10 }}>
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

          <Text
            variant="caption"
            color="textTertiary"
            style={{ textAlign: 'center', marginTop: 14 }}
          >
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
  isDark,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  tone: ThemeColor;
  colors: ThemeColors;
  isDark: boolean;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 30,
        right: 30,
        bottom: 44,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#1A1412',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.4 : 0.14,
        shadowRadius: 18,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: tone === 'success' ? colors.sageLight : colors.surfaceTertiary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconSymbol name={icon} size={22} color={tone} />
      </View>
      <View style={{ gap: 3, flex: 1 }}>
        <Text variant="subhead">{title}</Text>
        <Text variant="caption" color="textSecondary">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
