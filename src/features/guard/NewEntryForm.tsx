import { View } from 'react-native';
import { alert } from '@/lib/alert';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Button, Card, Chip, Field, Text } from '@/components';
import { FlatSearchField } from '@/features/guard/FlatSearchField';
import { PhotoCaptureField } from '@/features/guard/PhotoCaptureField';
import { createGuardSchemas, defaultNewEntryValues, purposesFor, titleForType, type NewEntryInput, type VisitorType } from '@/features/guard/schemas';
import { formatFlatLabel } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface Props {
  completionBaseHref?: '/(guard)/(add)/waiting' | '/(guard)/(home)/waiting';
  guardId?: string;
  initialFlat?: { id: string; label: string };
  societyId?: string | null;
  type: VisitorType;
}

function buildGuardNote(input: NewEntryInput) {
  const details = [
    input.company ? `Company: ${input.company}` : undefined,
    input.vehicleNumber ? `Vehicle: ${input.vehicleNumber}` : undefined,
    input.serviceType ? `Service: ${input.serviceType}` : undefined,
  ].filter(Boolean);

  return details.length ? details.join('\n') : null;
}

export function NewEntryForm({ completionBaseHref = '/(guard)/(add)/waiting', guardId, initialFlat, societyId, type }: Props) {
  const { t } = useTranslation();
  const { newEntrySchema } = useMemo(() => createGuardSchemas(t), [t]);
  const queryClient = useQueryClient();
  const { control, handleSubmit, watch, setValue } = useForm<NewEntryInput>({
    defaultValues: defaultNewEntryValues(type),
    resolver: zodResolver(newEntrySchema),
  });
  const selectedType = watch('type');
  const selectedPurpose = watch('purpose');

  useEffect(() => {
    if (!initialFlat?.id) return;
    setValue('flatId', initialFlat.id);
    if (initialFlat.label) setValue('flatLabel', initialFlat.label);
  }, [initialFlat, setValue]);

  const createVisitor = useMutation({
    mutationFn: async (input: NewEntryInput) => {
      if (!guardId || !societyId) throw new Error('Guard profile is not ready yet.');

      const { data, error } = await supabase
        .from('visitors')
        .insert({
          flat_id: input.flatId,
          guard_id: guardId,
          guard_note: buildGuardNote(input),
          purpose: input.purpose,
          society_id: societyId,
          status: 'pending',
          type: input.type,
          visitor_name: input.visitorName.trim(),
          visitor_phone: input.visitorPhone?.trim() || null,
          visitor_photo_path: input.visitorPhotoPath || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: (visitorId) => {
      queryClient.invalidateQueries({ queryKey: ['guard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['guard-activity'] });
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      const waitingPath =
        completionBaseHref === '/(guard)/(home)/waiting'
          ? '/(guard)/(home)/waiting/[visitorId]'
          : '/(guard)/(add)/waiting/[visitorId]';
      router.replace({
        pathname: waitingPath,
        params: { visitorId },
      });
    },
    onError: (error) => {
      alert(
        t('alert.titles.couldNotSendApproval'),
        error instanceof Error ? error.message : t('common.pleaseTryAgain'),
      );
    },
  });

  const submit = handleSubmit((input) => createVisitor.mutate(input));

  return (
    <View className="gap-lg">
      <View className="gap-xs">
        <Text variant="titleLarge">
          {t('nav.screens.newEntry')} — {titleForType(selectedType, t)}
        </Text>
        <Text variant="body" color="textSecondary">
          {t('guard.entry.residentInstantRequest')}
        </Text>
      </View>

      <Controller
        control={control}
        name="visitorPhotoPath"
        render={({ field }) => <PhotoCaptureField value={field.value} onCaptured={field.onChange} />}
      />

      <Field.Controlled
        control={control}
        name="visitorName"
        label={t('guard.entry.visitorName')}
        placeholder={t('guard.entry.placeholders.visitorName')}
      />

      {(selectedType === 'delivery' || selectedType === 'service') && (
        <Field.Controlled
          control={control}
          name="company"
          label={t('guard.entry.company')}
          placeholder={t('guard.entry.placeholders.company')}
        />
      )}

      {selectedType === 'service' && (
        <Field.Controlled
          control={control}
          name="serviceType"
          label={t('guard.entry.serviceType')}
          placeholder={t('guard.entry.placeholders.serviceType')}
        />
      )}

      {selectedType === 'cab' && (
        <Field.Controlled
          control={control}
          name="vehicleNumber"
          label={t('guard.entry.vehicleNumber')}
          placeholder={t('guard.entry.placeholders.vehicleNumber')}
          autoCapitalize="characters"
        />
      )}

      <Field.Controlled
        control={control}
        name="visitorPhone"
        label={t('common.phone')}
        placeholder={t('guard.entry.placeholders.phone')}
        keyboardType="phone-pad"
      />

      <Controller
        control={control}
        name="flatId"
        render={({ field, fieldState }) => (
          <FlatSearchField
            societyId={societyId}
            value={field.value}
            label={watch('flatLabel')}
            error={fieldState.error?.message}
            onClear={() => {
              field.onChange('');
              setValue('flatLabel', '');
            }}
            onSelect={(flat) => {
              field.onChange(flat.id);
              const label = formatFlatLabel(flat.tower_name, flat.number, 'Flat');
              setValue('flatLabel', `${label}${flat.primary_resident ? ` (${flat.primary_resident})` : ''}`);
            }}
          />
        )}
      />

      <Card className="gap-md">
        <Text variant="caption" color="textSecondary">
          PURPOSE
        </Text>
        <View className="flex-row flex-wrap gap-sm">
          {purposesFor(selectedType).map((purpose) => (
            <Chip
              key={purpose}
              label={purpose}
              selected={selectedPurpose === purpose}
              onPress={() => setValue('purpose', purpose, { shouldValidate: true })}
            />
          ))}
        </View>
      </Card>

      <Card variant="outlined" className="flex-row items-center gap-sm bg-surface-secondary">
        <Text variant="title" color="warning">
          !
        </Text>
        <Text variant="footnote" color="textSecondary" className="flex-1">
          {t('guard.entry.residentInstantNotification')}
        </Text>
      </Card>

      <Button label={t('guard.entry.sendForApproval')} icon="arrow_forward" loading={createVisitor.isPending} full onPress={submit} />
    </View>
  );
}
