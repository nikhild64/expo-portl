import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button, Card, Checkbox, Chip, DateField, dateFromValue, DateTimeField, Field, IconSymbol, SegmentedControl, Text } from '@/components';
import { useFrequentVisitors } from '@/queries/useFrequentVisitors';
import {
  formatDateWithWeekday,
} from '@/lib/format';
import {
  createPreApprovalSchema,
  defaultPreApprovalValues,
  type PreApprovalInput,
} from '@/features/visitors/schemas';

interface Props {
  loading?: boolean;
  onSubmit: (input: PreApprovalInput) => void;
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
  }, [recurring, expiryType, customExpiryDate, setValue, getValues]);

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
