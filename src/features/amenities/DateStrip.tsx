import { Pressable, ScrollView, View } from 'react-native';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';

interface Props {
  onSelect: (date: Date) => void;
  selected: Date;
}

export function DateStrip({ onSelect, selected }: Props) {
  const { t } = useTranslation();
  const dates = Array.from({ length: 14 }, (_value, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date;
  });

  return (
    <View className="gap-sm">
      <Text variant="caption" color="textSecondary">
        {t('resident.amenities.selectDate')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {dates.map((date) => {
          const isSelected = date.toDateString() === selected.toDateString();

          return (
            <Pressable
              key={date.toDateString()}
              onPress={() => onSelect(date)}
              className={`items-center rounded-md px-md py-sm${isSelected ? ' bg-coral' : ' bg-surface-secondary'}`}
              style={{ borderCurve: 'continuous', minWidth: 56 }}
            >
              <Text variant="caption" color={isSelected ? 'onPrimary' : 'textSecondary'}>
                {format(date, 'EEE')}
              </Text>
              <Text variant="headline" color={isSelected ? 'onPrimary' : 'textPrimary'}>
                {format(date, 'd')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
