import { useState } from 'react';
import { Pressable, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { formatDateWithWeekday } from '@/lib/format';

import { IconSymbol } from './IconSymbol';
import { Text } from './Text';

function valueToDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return new Date();
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function dateToValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface Props {
  error?: string;
  helper?: string;
  label: string;
  minimumDate?: Date;
  normalizeToMonthStart?: boolean;
  onChange: (value: string) => void;
  selectedLabel: string;
  value: string;
}

export function DateField({
  error,
  helper,
  label,
  minimumDate,
  normalizeToMonthStart = false,
  onChange,
  selectedLabel,
  value,
}: Props) {
  const [open, setOpen] = useState(false);
  const date = valueToDate(value);
  const borderClass = error ? 'border-error' : 'border-border';

  const commit = (selected: Date) => {
    const next = normalizeToMonthStart
      ? new Date(selected.getFullYear(), selected.getMonth(), 1)
      : selected;
    onChange(dateToValue(next));
  };

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (process.env.EXPO_OS !== 'ios') setOpen(false);
    if (event.type === 'dismissed' || !selected) return;
    commit(selected);
  };

  return (
    <View className="gap-xs">
      <Text variant="footnote" color="textSecondary">
        {label}
      </Text>
      <View className={`gap-sm rounded-md border bg-surface p-md ${borderClass}`} style={{ borderCurve: 'continuous' }}>
        <View className="flex-row items-center gap-sm">
          <IconSymbol name="calendar_today" size={20} color={error ? 'error' : 'textSecondary'} />
          <View className="flex-1">
            <Text variant="caption" color="textSecondary">
              {selectedLabel}
            </Text>
            <Text variant="headline">{formatDateWithWeekday(date)}</Text>
          </View>
        </View>

        {process.env.EXPO_OS === 'ios' ? (
          <DateTimePicker
            value={date}
            mode="date"
            display="compact"
            minimumDate={minimumDate}
            onChange={handleChange}
          />
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              className="rounded-md border border-border bg-surface-secondary p-sm"
              onPress={() => setOpen(true)}
              style={{ borderCurve: 'continuous' }}
            >
              <Text variant="subhead">{formatDateWithWeekday(date)}</Text>
            </Pressable>
            {open ? (
              <DateTimePicker value={date} mode="date" minimumDate={minimumDate} onChange={handleChange} />
            ) : null}
          </>
        )}
      </View>
      {(error || helper) && (
        <Text variant="footnote" color={error ? 'error' : 'textSecondary'}>
          {error ?? helper}
        </Text>
      )}
    </View>
  );
}
