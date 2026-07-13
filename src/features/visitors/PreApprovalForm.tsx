import { useState } from 'react';
import { Pressable, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Button, Card, Chip, Field, IconSymbol, Text } from '@/components';
import {
  defaultPreApprovalValues,
  preApprovalSchema,
  type PreApprovalInput,
} from '@/features/visitors/schemas';

const visitorTypes: { label: string; value: PreApprovalInput['type'] }[] = [
  { label: 'Guest', value: 'guest' },
  { label: 'Delivery', value: 'delivery' },
  { label: 'Cab', value: 'cab' },
  { label: 'Service', value: 'service' },
];

type PickerMode = 'date' | 'time';

interface Props {
  loading?: boolean;
  onSubmit: (input: PreApprovalInput) => void;
}

interface DateTimeFieldProps {
  error?: string;
  helper?: string;
  label: string;
  minimumDate?: Date;
  onChange: (value: string) => void;
  value: string;
}

function dateFromValue(value: string) {
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
    year: 'numeric',
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    weekday: 'short',
  }).format(date);
}

function DateTimeField({ error, helper, label, minimumDate, onChange, value }: DateTimeFieldProps) {
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
      accessibilityLabel={`Choose ${label.toLowerCase()} ${title.toLowerCase()}`}
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
              Selected
            </Text>
            <Text variant="headline">{formatDateTime(date)}</Text>
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
            {renderAndroidTrigger('date', 'Date', formatDate(date))}
            {renderAndroidTrigger('time', 'Time', formatTime(date))}
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

export function PreApprovalForm({ loading, onSubmit }: Props) {
  const { control, getValues, handleSubmit, setValue, watch } = useForm<PreApprovalInput>({
    defaultValues: defaultPreApprovalValues(),
    resolver: zodResolver(preApprovalSchema),
  });
  const hasVehicle = watch('hasVehicle');

  return (
    <View className="gap-lg">
      <Card className="gap-md">
        <Text variant="caption" color="textSecondary">
          VISITOR TYPE
        </Text>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <View className="flex-row flex-wrap gap-sm">
              {visitorTypes.map((type) => (
                <Chip
                  key={type.value}
                  label={type.label}
                  selected={field.value === type.value}
                  onPress={() => field.onChange(type.value)}
                />
              ))}
            </View>
          )}
        />
      </Card>

      <Field.Controlled control={control} name="visitorName" label="Visitor name" placeholder="Amit Verma" />
      <Field.Controlled
        control={control}
        name="visitorPhone"
        label="Phone"
        placeholder="+91 98000 00000"
        keyboardType="phone-pad"
      />
      <Field.Controlled
        control={control}
        name="count"
        label="Number of guests"
        keyboardType="number-pad"
      />
      <Controller
        control={control}
        name="startAt"
        render={({ field, fieldState }) => (
          <DateTimeField
            label="Start time"
            value={field.value}
            minimumDate={new Date()}
            helper="Choose when this QR becomes valid."
            error={fieldState.error?.message}
            onChange={(value) => {
              field.onChange(value);

              const start = new Date(value);
              const end = new Date(getValues('endAt'));

              if (Number.isNaN(end.getTime()) || end <= start) {
                const nextEnd = new Date(start);
                nextEnd.setHours(nextEnd.getHours() + 2);
                setValue('endAt', nextEnd.toISOString(), { shouldValidate: true });
              }
            }}
          />
        )}
      />
      <Controller
        control={control}
        name="endAt"
        render={({ field, fieldState }) => (
          <DateTimeField
            label="End time"
            value={field.value}
            minimumDate={dateFromValue(watch('startAt'))}
            helper="Choose when this QR should expire."
            error={fieldState.error?.message}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="hasVehicle"
        render={({ field }) => (
          <Chip
            label={field.value ? 'Vehicle details added' : 'Add vehicle details'}
            selected={field.value}
            icon="directions_car"
            onPress={() => field.onChange(!field.value)}
          />
        )}
      />

      {hasVehicle && <Field.Controlled control={control} name="vehiclePlate" label="Vehicle plate" placeholder="DL 01 AB 1234" />}

      <Field.Controlled
        control={control}
        name="notes"
        label="Purpose / notes"
        placeholder="Weekend dinner and stay over"
        multiline
      />

      <Card variant="outlined" className="flex-row gap-md">
        <IconSymbol name="lightbulb" color="coral" />
        <Text variant="footnote" color="textSecondary" className="flex-1">
          Visitor will get an SMS and WhatsApp with an entry QR code.
        </Text>
      </Card>

      <Button label="Create pre-approval" icon="check_circle" loading={loading} onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
