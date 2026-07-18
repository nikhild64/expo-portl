import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button, Card, Checkbox, Chip, DateField, Field, IconSymbol, SegmentedControl, Text } from '@/components';
import { useFrequentVisitors } from '@/queries/useFrequentVisitors';
import {
  formatDateTimeWithWeekday,
  formatDateWithWeekday,
  formatTime,
} from '@/lib/format';
import {
  createPreApprovalSchema,
  defaultPreApprovalValues,
  type PreApprovalInput,
} from '@/features/visitors/schemas';

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
  t: (key: string, options?: Record<string, unknown>) => string;
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

function DateTimeField({ error, helper, label, minimumDate, onChange, t, value }: DateTimeFieldProps) {
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
            {renderAndroidTrigger('date', t('resident.preapprove.date'), formatDateWithWeekday(date))}
            {renderAndroidTrigger('time', t('resident.preapprove.time'), formatTime(date))}
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
  const { t } = useTranslation();
  const preApprovalSchema = useMemo(() => createPreApprovalSchema(t), [t]);
  const visitorTypes: { label: string; value: PreApprovalInput['type'] }[] = useMemo(
    () => [
      { label: t('resident.preapprove.guest'), value: 'guest' },
      { label: t('resident.preapprove.delivery'), value: 'delivery' },
      { label: t('resident.preapprove.cab'), value: 'cab' },
      { label: t('resident.preapprove.service'), value: 'service' },
    ],
    [t],
  );
  const { control, getValues, handleSubmit, setValue, watch } = useForm<PreApprovalInput>({
    defaultValues: defaultPreApprovalValues(),
    resolver: zodResolver(preApprovalSchema),
  });
  const { data: frequentVisitors = [] } = useFrequentVisitors();
  const hasVehicle = watch('hasVehicle');
  const recurring = watch('recurring');

  const [expiryType, setExpiryType] = useState<'never' | 'custom'>('never');
  const [customExpiryDate, setCustomExpiryDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Default to 7 days from now
    return d;
  });

  useEffect(() => {
    if (recurring) {
      setValue('startAt', new Date().toISOString());

      if (expiryType === 'never') {
        const farFuture = new Date();
        farFuture.setFullYear(farFuture.getFullYear() + 100);
        setValue('endAt', farFuture.toISOString(), { shouldValidate: true });
      } else {
        const customDate = new Date(customExpiryDate);
        customDate.setHours(23, 59, 59, 999);
        setValue('endAt', customDate.toISOString(), { shouldValidate: true });
      }
    } else {
      const currentStart = new Date(getValues('startAt'));
      const currentEnd = new Date(getValues('endAt'));
      if (!Number.isNaN(currentStart.getTime()) && !Number.isNaN(currentEnd.getTime())) {
        if (currentEnd.getFullYear() - currentStart.getFullYear() > 10) {
          const start = new Date();
          start.setMinutes(0, 0, 0);
          start.setHours(start.getHours() + 1);

          const end = new Date(start);
          end.setHours(end.getHours() + 2);

          setValue('startAt', start.toISOString());
          setValue('endAt', end.toISOString());
        }
      }
    }
  }, [recurring, expiryType, customExpiryDate, setValue]);

  const applyFrequentVisitor = (visitor: (typeof frequentVisitors)[number]) => {
    setValue('visitorName', visitor.visitor_name, { shouldValidate: true });
    setValue('visitorPhone', visitor.visitor_phone, { shouldValidate: true });
    setValue('type', visitor.visitor_type, { shouldValidate: true });
  };

  return (
    <View className="gap-lg">
      {!!frequentVisitors.length && (
        <Card className="gap-md">
          <Text variant="caption" color="textSecondary">
            {t('resident.preapprove.frequentVisitors')}
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {frequentVisitors.map((visitor) => (
              <Chip
                key={visitor.id}
                label={visitor.visitor_name}
                icon="person"
                onPress={() => applyFrequentVisitor(visitor)}
              />
            ))}
          </View>
        </Card>
      )}

      <Card className="gap-md">
        <Text variant="caption" color="textSecondary">
          {t('resident.preapprove.visitorType')}
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

      <Field.Controlled
        control={control}
        name="visitorName"
        label={t('resident.preapprove.visitorName')}
        placeholder={t('resident.preapprove.placeholders.visitorName')}
      />
      <Field.Controlled
        control={control}
        name="visitorPhone"
        label={t('common.phone')}
        placeholder={t('resident.preapprove.placeholders.phone')}
        keyboardType="phone-pad"
      />
      <Field.Controlled
        control={control}
        name="count"
        label={t('resident.preapprove.numberOfGuests')}
        keyboardType="number-pad"
      />
      {!recurring && (
        <>
          <Controller
            control={control}
            name="startAt"
            render={({ field, fieldState }) => (
              <DateTimeField
                label={t('resident.preapprove.startTime')}
                value={field.value}
                minimumDate={new Date()}
                helper={t('resident.preapprove.startTimeHelper')}
                error={fieldState.error?.message}
                t={t}
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
                label={t('resident.preapprove.endTime')}
                value={field.value}
                minimumDate={dateFromValue(watch('startAt'))}
                helper={t('resident.preapprove.endTimeHelper')}
                error={fieldState.error?.message}
                t={t}
                onChange={field.onChange}
              />
            )}
          />
        </>
      )}

      {recurring && (
        <Card className="gap-md">
          <Text variant="caption" color="textSecondary">
            {t('resident.preapprove.expiry')}
          </Text>
          <SegmentedControl
            value={expiryType}
            onChange={(val) => setExpiryType(val as 'never' | 'custom')}
            segments={[
              { label: t('resident.preapprove.noExpiry'), value: 'never' },
              { label: t('resident.preapprove.customExpiry'), value: 'custom' },
            ]}
          />
          {expiryType === 'custom' && (
            <Controller
              control={control}
              name="endAt"
              render={({ fieldState }) => {
                const year = customExpiryDate.getFullYear();
                const month = String(customExpiryDate.getMonth() + 1).padStart(2, '0');
                const day = String(customExpiryDate.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;

                return (
                  <DateField
                    label={t('resident.preapprove.expiryDate')}
                    selectedLabel={t('common.selected')}
                    value={formattedDate}
                    minimumDate={new Date()}
                    helper={t('resident.preapprove.expiryDateHelper')}
                    error={fieldState.error?.message}
                    onChange={(value) => {
                      const parts = value.split('-');
                      const nextDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                      setCustomExpiryDate(nextDate);
                    }}
                  />
                );
              }}
            />
          )}
        </Card>
      )}

      <Controller
        control={control}
        name="recurring"
        render={({ field }) => (
          <Checkbox
            label={t('resident.preapprove.allowMultipleEntries')}
            checked={field.value}
            onPress={() => field.onChange(!field.value)}
          />
        )}
      />

      <Controller
        control={control}
        name="hasVehicle"
        render={({ field }) => (
          <Chip
            label={field.value ? t('resident.preapprove.vehicleDetailsAdded') : t('resident.preapprove.addVehicleDetails')}
            selected={field.value}
            icon="directions_car"
            onPress={() => field.onChange(!field.value)}
          />
        )}
      />

      {hasVehicle && (
        <Field.Controlled
          control={control}
          name="vehiclePlate"
          label={t('resident.preapprove.vehiclePlate')}
          placeholder={t('resident.preapprove.placeholders.vehiclePlate')}
        />
      )}

      <Field.Controlled
        control={control}
        name="notes"
        label={t('resident.preapprove.purposeNotes')}
        placeholder={t('resident.preapprove.placeholders.purpose')}
        multiline
      />

      <Button label={t('resident.preapprove.createPreapproval')} icon="check_circle" loading={loading} onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
