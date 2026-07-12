import { ScrollView } from 'react-native';

import { Chip } from '@/components';

interface Props {
  onSelect: (date: Date) => void;
  selected: Date;
}

export function DateStrip({ onSelect, selected }: Props) {
  const dates = Array.from({ length: 7 }, (_value, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date;
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {dates.map((date) => (
        <Chip
          key={date.toDateString()}
          label={new Intl.DateTimeFormat(undefined, { day: 'numeric', weekday: 'short' }).format(date)}
          selected={date.toDateString() === selected.toDateString()}
          onPress={() => onSelect(date)}
        />
      ))}
    </ScrollView>
  );
}
