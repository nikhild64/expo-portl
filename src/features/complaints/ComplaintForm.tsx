import { Pressable, ScrollView, View } from 'react-native';
import { alertError, alertFlatRequired } from '@/lib/alert';
import { Image } from 'expo-image';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Chip, Field, IconSymbol, Text } from '@/components';
import {
  pickGalleryPhotos,
  pickImageSourceI18n,
  takeCameraPhoto,
  uploadPrivateImage,
} from '@/lib/imageUpload';
import { useCreateComplaint } from '@/queries/useComplaints';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

import { COMPLAINT_CATEGORIES } from './constants';

function createComplaintSchema(t: TFunction) {
  return z.object({
    category: z.string().min(2, t('validation.selectPurpose')),
    description: z.string().min(10, t('common.description')),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    title: z.string().min(3, t('common.title')),
  });
}

type ComplaintInput = z.infer<ReturnType<typeof createComplaintSchema>>;

const categories = [...COMPLAINT_CATEGORIES];
const priorities: Tables<'complaints'>['priority'][] = ['low', 'medium', 'high', 'urgent'];

async function uploadComplaintPhoto(uri: string, uid: string) {
  return uploadPrivateImage('complaint-photos', uri, { prefix: uid, width: 1280, compress: 0.82 });
}

interface Props {
  onCreated: (id: string) => void;
}

export function ComplaintForm({ onCreated }: Props) {
  const { t } = useTranslation();
  const complaintSchema = useMemo(() => createComplaintSchema(t), [t]);
  const profile = useAuthStore((s) => s.profile);
  const uid = useAuthStore((s) => s.session?.user.id);
  const { data: primaryFlat } = useMyPrimaryFlat();
  const createComplaint = useCreateComplaint();
  const { control, handleSubmit, setValue, watch } = useForm<ComplaintInput>({
    defaultValues: {
      category: categories[0],
      description: '',
      priority: 'medium',
      title: '',
    },
    resolver: zodResolver(complaintSchema),
  });
  const category = watch('category');
  const priority = watch('priority');
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  const addPhotos = (uris: string[]) => {
    setPhotoUris((current) => [...current, ...uris].slice(0, 4));
  };

  const removePhoto = (index: number) => {
    setPhotoUris((current) => current.filter((_, i) => i !== index));
  };

  const choosePhotoSource = () => {
    if (photoUris.length >= 4) return;

    pickImageSourceI18n(t, {
      titleKey: 'alert.titles.addPhoto',
      messageKey: 'alert.messages.chooseAttachPhoto',
      onCamera: takePhoto,
      onGallery: pickPhotos,
    });
  };

  const takePhoto = async () => {
    const uri = await takeCameraPhoto();
    if (uri) addPhotos([uri]);
  };

  const pickPhotos = async () => {
    const uris = await pickGalleryPhotos({
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 4 - photoUris.length),
    });
    if (uris.length) addPhotos(uris);
  };

  const submit = async (input: ComplaintInput) => {
    if (!uid || !profile?.society_id || !primaryFlat?.flat_id) {
      alertFlatRequired(t, 'alert.messages.joinFlatComplaints');
      return;
    }

    try {
      const photos = await Promise.all(photoUris.map((uri) => uploadComplaintPhoto(uri, uid)));
      const complaint = await createComplaint.mutateAsync({
        category: input.category,
        description: input.description.trim(),
        flat_id: primaryFlat.flat_id,
        photos,
        priority: input.priority,
        raised_by: uid,
        society_id: profile.society_id,
        status: 'new',
        title: input.title.trim(),
      });
      onCreated(complaint.id);
    } catch (error) {
      alertError(t('alert.titles.couldNotCreateComplaint'), error);
    }
  };

  return (
    <View className="gap-lg">
      <Field.Controlled
        control={control}
        name="title"
        label={t('common.title')}
        placeholder={t('resident.complaints.placeholders.title')}
      />
      <Field.Controlled control={control} name="description" label={t('common.description')} multiline />

      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          {t('resident.complaints.category')}
        </Text>
        <Controller
          control={control}
          name="category"
          render={() => (
            <View className="flex-row flex-wrap gap-sm">
              {categories.map((item) => (
                <Chip
                  key={item}
                  label={t(`resident.complaints.categories.${item}`)}
                  selected={category === item}
                  onPress={() => setValue('category', item)}
                />
              ))}
            </View>
          )}
        />
      </View>

      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          {t('resident.complaints.priority')}
        </Text>
        <View className="flex-row flex-wrap gap-sm">
          {priorities.map((item) => (
            <Chip
              key={item}
              label={t(`resident.complaints.priorities.${item}`)}
              selected={priority === item}
              onPress={() => setValue('priority', item)}
            />
          ))}
        </View>
      </View>

      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          {t('resident.complaints.photoEvidence')} {photoUris.length > 0 ? `(${photoUris.length}/4)` : ''}
        </Text>
        <Button
          label={photoUris.length >= 4 ? t('resident.complaints.photoLimitReached') : t('resident.complaints.addPhoto')}
          variant="outlined"
          icon="attach_file"
          onPress={choosePhotoSource}
          disabled={photoUris.length >= 4}
        />

        {photoUris.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 4, paddingRight: 4 }}>
            {photoUris.map((uri, index) => (
              <View key={`${uri}-${index}`} className="relative" style={{ width: 88, height: 88 }}>
                <Image
                  source={{ uri }}
                  style={{ width: 88, height: 88, borderRadius: 12 }}
                  className="bg-surface-secondary"
                  contentFit="cover"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('resident.complaints.removePhoto')}
                  onPress={() => removePhoto(index)}
                  className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-pill border border-border bg-surface"
                >
                  <IconSymbol name="close" size={14} color="textSecondary" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text variant="footnote" color="textTertiary">
            {t('resident.complaints.addPhotos')}
          </Text>
        )}
      </View>
      <Button label={t('nav.screens.raiseTicket')} loading={createComplaint.isPending} onPress={handleSubmit(submit)} />
    </View>
  );
}
