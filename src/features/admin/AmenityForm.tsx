import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { alertError } from '@/lib/alert';
import { Image } from 'expo-image';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, Chip, Field, IconSymbol, Text } from '@/components';
import { formatTime } from '@/lib/format';
import {
  pickGalleryPhotos,
  pickImageSourceI18n,
  takeCameraPhoto,
  uploadPublicImage,
} from '@/lib/imageUpload';
import { AMENITY_COVERS_BUCKET } from '@/lib/storage';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

export type AmenityFormValues = {
  active: boolean;
  availableFrom: string;
  availableTo: string;
  capacity?: number;
  coverImageUrl?: string;
  dailyPrice?: number;
  deposit?: number;
  description?: string;
  hourlyPrice?: number;
  name: string;
  rulesText?: string;
};

interface Props {
  amenity?: Tables<'amenities'> | null;
  loading?: boolean;
  onSubmit: (values: AmenityFormValues) => void;
}

function timeStringToDate(value: string) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  const date = new Date();
  date.setHours(match ? Number(match[1]) : 0, match ? Number(match[2]) : 0, 0, 0);
  return date;
}

function dateToTimeString(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function timeToMinutes(value: string) {
  const date = timeStringToDate(value);
  return date.getHours() * 60 + date.getMinutes();
}

interface TimeFieldProps {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  t: (key: string) => string;
  value: string;
}

function TimeField({ error, label, onChange, t, value }: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const date = timeStringToDate(value);
  const borderClass = error ? 'border-error' : 'border-border';

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (process.env.EXPO_OS !== 'ios') setOpen(false);
    if (event.type === 'dismissed' || !selected) return;
    onChange(dateToTimeString(selected));
  };

  return (
    <View className="gap-xs">
      <Text variant="footnote" color="textSecondary">
        {label}
      </Text>
      <View className={`gap-sm rounded-md border bg-surface p-md ${borderClass}`} style={{ borderCurve: 'continuous' }}>
        <View className="flex-row items-center gap-sm">
          <IconSymbol name="schedule" size={20} color={error ? 'error' : 'textSecondary'} />
          <View className="flex-1">
            <Text variant="caption" color="textSecondary">
              {t('common.selected')}
            </Text>
            <Text variant="headline">{formatTime(date)}</Text>
          </View>
        </View>

        {process.env.EXPO_OS === 'ios' ? (
          <DateTimePicker value={date} mode="time" display="compact" onChange={handleChange} />
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              className="rounded-md border border-border bg-surface-secondary p-sm"
              onPress={() => setOpen(true)}
              style={{ borderCurve: 'continuous' }}
            >
              <Text variant="subhead">{formatTime(date)}</Text>
            </Pressable>
            {open ? <DateTimePicker value={date} mode="time" onChange={handleChange} /> : null}
          </>
        )}
      </View>
      {error ? (
        <Text variant="footnote" color="error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function AmenityForm({ amenity, loading, onSubmit }: Props) {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id) ?? amenity?.society_id ?? null;
  const [uploadingCover, setUploadingCover] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          active: z.boolean(),
          availableFrom: z.string().min(1),
          availableTo: z.string().min(1),
          capacity: z.coerce.number().int().min(0).optional(),
          coverImageUrl: z.string().optional(),
          dailyPrice: z.coerce.number().min(0).optional(),
          deposit: z.coerce.number().min(0).optional(),
          description: z.string().optional(),
          hourlyPrice: z.coerce.number().min(0).optional(),
          name: z.string().min(2, t('validation.fullNameRequired')),
          rulesText: z.string().optional(),
        })
        .refine((values) => timeToMinutes(values.availableTo) > timeToMinutes(values.availableFrom), {
          message: t('validation.endTimeAfterStart'),
          path: ['availableTo'],
        }),
    [t],
  );

  const { control, handleSubmit, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      active: amenity?.active ?? true,
      availableFrom: amenity?.available_from?.slice(0, 5) ?? '08:00',
      availableTo: amenity?.available_to?.slice(0, 5) ?? '22:00',
      capacity: amenity?.capacity ?? 10,
      coverImageUrl: amenity?.cover_image_url ?? '',
      dailyPrice: amenity?.daily_price ?? 0,
      deposit: amenity?.deposit ?? 0,
      description: amenity?.description ?? '',
      hourlyPrice: amenity?.hourly_price ?? 0,
      name: amenity?.name ?? '',
      rulesText: amenity?.rules_text ?? '',
    },
  });

  const coverImageUrl = watch('coverImageUrl');

  const applyCover = async (uri: string) => {
    if (!societyId) return;
    setUploadingCover(true);
    try {
      const prefix = amenity?.id ? `${societyId}/${amenity.id}` : `${societyId}/draft`;
      const publicUrl = await uploadPublicImage(AMENITY_COVERS_BUCKET, uri, `${prefix}/${Date.now()}.jpg`, {
        width: 1280,
        compress: 0.85,
      });
      setValue('coverImageUrl', publicUrl, { shouldDirty: true });
    } catch (error) {
      alertError(t('alert.titles.photoUploadFailed'), error);
    } finally {
      setUploadingCover(false);
    }
  };

  const chooseCoverSource = () => {
    pickImageSourceI18n(t, {
      titleKey: 'admin.community.changeCoverImage',
      messageKey: 'admin.community.changeCoverImageMsg',
      onCamera: async () => {
        const uri = await takeCameraPhoto({ allowsEditing: true, aspect: [16, 9] });
        if (uri) await applyCover(uri);
      },
      onGallery: async () => {
        const [uri] = await pickGalleryPhotos({ allowsEditing: true, aspect: [16, 9] });
        if (uri) await applyCover(uri);
      },
    });
  };

  return (
    <Card className="gap-md">
      <Text variant="headline">{amenity ? t('nav.screens.amenity') : t('admin.community.newAmenity')}</Text>
      <Field.Controlled control={control} name="name" label={t('common.name')} />
      <Field.Controlled control={control} name="description" label={t('common.description')} />

      <View className="gap-sm">
        <Text variant="footnote" color="textSecondary">
          {t('admin.community.coverImage')}
        </Text>
        {coverImageUrl ? (
          <Image source={{ uri: coverImageUrl }} className="h-40 w-full rounded-lg bg-surface-secondary" contentFit="cover" />
        ) : (
          <View className="h-40 items-center justify-center rounded-lg bg-surface-secondary">
            <IconSymbol name="event_seat" size={32} color="textSecondary" />
          </View>
        )}
        <Button
          label={t('admin.community.changeCoverImage')}
          variant="outlined"
          icon="photo_camera"
          loading={uploadingCover}
          disabled={loading || !societyId}
          onPress={chooseCoverSource}
        />
      </View>

      <Field.Controlled control={control} name="capacity" label={t('admin.community.capacity')} keyboardType="number-pad" />
      <Field.Controlled control={control} name="hourlyPrice" label={t('admin.community.hourlyPrice')} keyboardType="number-pad" />
      <Field.Controlled control={control} name="dailyPrice" label={t('admin.community.dailyPrice')} keyboardType="number-pad" />
      <Field.Controlled control={control} name="deposit" label={t('admin.community.deposit')} keyboardType="number-pad" />

      <Controller
        control={control}
        name="availableFrom"
        render={({ field, fieldState }) => (
          <TimeField label={t('admin.community.availableFrom')} value={field.value} error={fieldState.error?.message} t={t} onChange={field.onChange} />
        )}
      />
      <Controller
        control={control}
        name="availableTo"
        render={({ field, fieldState }) => (
          <TimeField label={t('admin.community.availableTo')} value={field.value} error={fieldState.error?.message} t={t} onChange={field.onChange} />
        )}
      />

      <Field.Controlled control={control} name="rulesText" label={t('admin.community.rules')} multiline numberOfLines={4} textAlignVertical="top" />
      <View className="flex-row flex-wrap gap-sm">
        <Chip label={t('common.active')} selected={watch('active')} onPress={() => setValue('active', !watch('active'))} />
      </View>
      <Button label={t('admin.community.saveAmenity')} loading={loading} onPress={handleSubmit((values) => onSubmit(schema.parse(values)))} />
    </Card>
  );
}
