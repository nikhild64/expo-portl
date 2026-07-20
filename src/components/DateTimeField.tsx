import { useState } from 'react';
import { Pressable, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

import {
  formatDateTimeWithWeekday,
  formatDateWithWeekday,
  formatTime,
} from '@/lib/format';

import { IconSymbol } from './IconSymbol';
import { Text } from './Text';

type PickerMode = 'date' | 'time';

export interface DateTimeFieldProps {
  error?: string;
  helper?: string;
  label: string;
  minimumDate?: Date;
  onChange: (value: string) => void;
  value: string;
}

export function dateFromValue(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function applyPickerValue(current: Date, selected: Date, mode: PickerMode) {
  const next = new Date(current);

  if (mode === 'date') {
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
  } else {
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
  }

  return next;
}

export function DateTimeField({ error, helper, label, minimumDate, onChange, value }: DateTimeFieldProps) {
  const { t } = useTranslation();
  const [activePicker, setActivePicker] = useState<PickerMode | null>(null);
  const date = dateFromValue(value);
  const borderClass = error ? 'border-error' : 'border-border';

  const updateValue = (selected: Date, mode: PickerMode) => {
    onChange(applyPickerValue(date, selected, mode).toISOString());
  };

  const handlePickerChange = (mode: PickerMode) => (event: DateTimePickerEvent, selected?: Date) => {
    if (process.env.EXPO_OS !== 'ios') {
      setActivePicker(null);
    }

    if (event.type === 'dismissed' || !selected) return;
    updateValue(selected, mode);
  };

  const renderAndroidTrigger = (mode: PickerMode, title: string, valueLabel: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('a11y.chooseDateTime', { label, mode: title })}
      className="flex-1 rounded-md border border-border bg-surface-secondary p-sm"
      onPress={() => setActivePicker(mode)}
      style={{ borderCurve: 'continuous' }}
    >
      <Text variant="caption" color="textSecondary">
        {title}
      </Text>
      <Text variant="subhead" className="mt-xs">
        {valueLabel}
      </Text>
    </Pressable>
  );

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
              {t('common.selected')}
            </Text>
            <Text variant="headline">{formatDateTimeWithWeekday(date)}</Text>
          </View>
        </View>

        {process.env.EXPO_OS === 'ios' ? (
          <View className="flex-row flex-wrap items-center gap-base">
            <DateTimePicker
              value={date}
              mode="date"
              display="compact"
              minimumDate={minimumDate}
              onChange={handlePickerChange('date')}
            />
            <DateTimePicker value={date} mode="time" display="compact" onChange={handlePickerChange('time')} />
          </View>
        ) : (
          <View className="flex-row gap-sm">
            {renderAndroidTrigger('date', t('resident.preapprove.date') || 'Date', formatDateWithWeekday(date))}
            {renderAndroidTrigger('time', t('resident.preapprove.time') || 'Time', formatTime(date))}
          </View>
        )}
      </View>

      {(error || helper) && (
        <Text variant="footnote" color={error ? 'error' : 'textSecondary'}>
          {error ?? helper}
        </Text>
      )}

      {activePicker ? (
        <DateTimePicker
          value={date}
          mode={activePicker}
          minimumDate={activePicker === 'date' ? minimumDate : undefined}
          onChange={handlePickerChange(activePicker)}
        />
      ) : null}
    </View>
  );
}
