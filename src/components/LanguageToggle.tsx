import { Pressable, View } from 'react-native';

import { useLocale } from '@/hooks/useLocale';
import { type AppLocale } from '@/lib/localePreference';

import { Text } from './Text';

const segments: { value: AppLocale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'hi', label: 'अ' },
];

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <View
      className="flex-row rounded-md border border-border bg-surface/95 p-0.5 shadow-elevation-sm"
      style={{ borderCurve: 'continuous' }}
    >
      {segments.map((segment) => {
        const selected = locale === segment.value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={segment.value === 'en' ? 'English' : 'Hindi'}
            onPress={() => setLocale(segment.value)}
            className={`min-w-[40px] items-center rounded-sm px-sm py-xs${selected ? ' bg-coral' : ''}`}
            style={{ borderCurve: 'continuous' }}
            android_ripple={{ color: 'rgba(249,112,102,0.15)' }}
          >
            <Text variant="subhead" color={selected ? 'onPrimary' : 'textSecondary'}>
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
