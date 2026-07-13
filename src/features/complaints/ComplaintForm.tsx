import { Pressable, ScrollView, View } from 'react-native';
import { alert } from '@/lib/alert';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Chip, Field, IconSymbol, Text } from '@/components';
import { uploadToStorage } from '@/lib/upload';
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

async function normalizePhoto(uri: string) {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: 1280 });
  const image = await context.renderAsync();
  return image.saveAsync({ compress: 0.82, format: SaveFormat.JPEG });
}

async function uploadComplaintPhoto(uri: string, uid: string) {
  const normalized = await normalizePhoto(uri);
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  return uploadToStorage('complaint-photos', normalized.uri, path);
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

    alert(t('alert.titles.addPhoto'), t('alert.messages.chooseAttachPhoto'), [
      { text: t('alert.buttons.takePhoto'), onPress: () => void takePhoto() },
      { text: t('alert.buttons.chooseFromGallery'), onPress: () => void pickPhotos() },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert(t('alert.titles.cameraPermissionNeeded'), t('alert.messages.allowCameraComplaint'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      addPhotos(result.assets.map((asset) => asset.uri));
    }
  };

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ['images'],
      quality: 0.8,
      selectionLimit: Math.max(1, 4 - photoUris.length),
    });
    if (!result.canceled) {
      addPhotos(result.assets.map((asset) => asset.uri));
    }
  };

  const submit = async (input: ComplaintInput) => {
    if (!uid || !profile?.society_id || !primaryFlat?.flat_id) {
      alert(t('alert.titles.flatRequired'), t('alert.messages.joinFlatComplaints'));
      return;
    }

    try {
      const photos = [];
      for (const uri of photoUris) {
        photos.push(await uploadComplaintPhoto(uri, uid));
      }
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
      alert(
        t('alert.titles.couldNotCreateComplaint'),
        error instanceof Error ? error.message : t('common.pleaseTryAgain'),
      );
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
