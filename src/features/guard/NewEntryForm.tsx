import { Alert, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, type Href } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button, Card, Chip, Field, Text } from '@/components';
import { FlatSearchField } from '@/features/guard/FlatSearchField';
import { PhotoCaptureField } from '@/features/guard/PhotoCaptureField';
import { defaultNewEntryValues, newEntrySchema, purposesFor, titleForType, type NewEntryInput, type VisitorType } from '@/features/guard/schemas';
import { supabase } from '@/lib/supabase';

interface Props {
  guardId?: string;
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

export function NewEntryForm({ guardId, societyId, type }: Props) {
  const queryClient = useQueryClient();
  const { control, handleSubmit, watch, setValue } = useForm<NewEntryInput>({
    defaultValues: defaultNewEntryValues(type),
    resolver: zodResolver(newEntrySchema),
  });
  const selectedType = watch('type');
  const selectedPurpose = watch('purpose');

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
          visitor_photo_url: input.visitorPhotoUrl || null,
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
      router.replace(`/(guard)/(add)/waiting/${visitorId}` as Href);
    },
    onError: (error) => {
      Alert.alert('Could not send approval', error instanceof Error ? error.message : 'Please try again.');
    },
  });

  const submit = handleSubmit((input) => createVisitor.mutate(input));

  return (
    <View className="gap-lg">
      <View className="gap-xs">
        <Text variant="titleLarge">New {titleForType(selectedType).toLowerCase()}</Text>
        <Text variant="body" color="textSecondary">
          Resident will get an instant approval request.
        </Text>
      </View>

      <Controller
        control={control}
        name="visitorPhotoUrl"
        render={({ field }) => <PhotoCaptureField value={field.value} onCaptured={field.onChange} />}
      />

      <Field.Controlled control={control} name="visitorName" label="Visitor name" placeholder="Rakesh Kumar" />

      {(selectedType === 'delivery' || selectedType === 'service') && (
        <Field.Controlled control={control} name="company" label="Company" placeholder="Amazon" />
      )}

      {selectedType === 'service' && (
        <Field.Controlled control={control} name="serviceType" label="Service type" placeholder="Plumber, electrician, housekeeping" />
      )}

      {selectedType === 'cab' && (
        <Field.Controlled control={control} name="vehicleNumber" label="Vehicle number" placeholder="DL 01 AB 1234" autoCapitalize="characters" />
      )}

      <Field.Controlled
        control={control}
        name="visitorPhone"
        label="Phone number"
        placeholder="+91 98000 00000"
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
              setValue('flatLabel', `${flat.tower_name}-${flat.number}${flat.primary_resident ? ` (${flat.primary_resident})` : ''}`);
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
          Resident will get an instant notification.
        </Text>
      </Card>

      <Button label="Send for approval" icon="arrow_forward" loading={createVisitor.isPending} full onPress={submit} />
    </View>
  );
}
