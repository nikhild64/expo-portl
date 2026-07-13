import { View } from 'react-native';
import { alert } from '@/lib/alert';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, Field, Text } from '@/components';
import { SOCIETY_LOGOS_BUCKET } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { uploadToStorage } from '@/lib/upload';
import type { Tables } from '@/types/database';

const PLACEHOLDER = require('../../../assets/images/society-placeholder.png');

export type SocietySettingsValues = {
  address?: string;
  city?: string;
  logoUrl?: string;
  name: string;
};

interface Props {
  society: Tables<'societies'>;
  loading?: boolean;
  onSubmit: (values: SocietySettingsValues) => void;
}

async function normalizeLogo(uri: string) {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: 512 });
  const image = await context.renderAsync();
  return image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
}

async function uploadLogo(uri: string, societyId: string) {
  const normalized = await normalizeLogo(uri);
  const path = `${societyId}/${Date.now()}.jpg`;
  await uploadToStorage(SOCIETY_LOGOS_BUCKET, normalized.uri, path);
  return supabase.storage.from(SOCIETY_LOGOS_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function SocietySettingsForm({ society, loading, onSubmit }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        address: z.string().optional(),
        city: z.string().optional(),
        logoUrl: z.string().optional(),
        name: z.string().min(2, t('validation.fullNameRequired')),
      }),
    [t],
  );

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { control, handleSubmit, setValue, watch } = useForm<SocietySettingsValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      address: society.address ?? '',
      city: society.city ?? '',
      logoUrl: society.logo_url ?? '',
      name: society.name,
    },
  });
  const logoUrl = watch('logoUrl');

  const chooseLogoSource = () => {
    alert(t('alert.titles.changeLogo'), t('alert.messages.chooseSetLogo'), [
      { text: t('alert.buttons.takePhoto'), onPress: () => void takeLogo() },
      { text: t('alert.buttons.chooseFromGallery'), onPress: () => void pickLogo() },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const takeLogo = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert(t('alert.titles.cameraPermissionNeeded'), t('alert.messages.allowCameraLogo'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      await applyLogo(result.assets[0].uri);
    }
  };

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert(t('alert.titles.photoLibraryPermissionNeeded'), t('alert.messages.allowPhotoLibrary'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      await applyLogo(result.assets[0].uri);
    }
  };

  const applyLogo = async (uri: string) => {
    setUploadingLogo(true);
    try {
      const publicUrl = await uploadLogo(uri, society.id);
      setValue('logoUrl', publicUrl, { shouldDirty: true });
    } catch (error) {
      alert(
        t('alert.titles.logoUploadFailed'),
        error instanceof Error ? error.message : t('common.pleaseTryAgain'),
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <Card className="gap-md">
      <Text variant="headline">{t('admin.society.societySettings')}</Text>
      <Field.Controlled control={control} name="name" label={t('common.name')} />
      <Field.Controlled control={control} name="address" label={t('admin.society.address')} />
      <Field.Controlled control={control} name="city" label={t('admin.society.city')} />

      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          LOGO
        </Text>
        <View className="items-center gap-sm">
          <Image
            source={logoUrl ? { uri: logoUrl } : PLACEHOLDER}
            style={{ width: 96, height: 96, borderRadius: 16 }}
            className="bg-surface-secondary"
            contentFit="cover"
          />
          <Button
            label={t('admin.society.changeLogo')}
            variant="outlined"
            icon="photo_camera"
            loading={uploadingLogo}
            disabled={loading}
            onPress={chooseLogoSource}
          />
        </View>
      </View>

      <Button label={t('admin.society.saveSettings')} loading={loading} onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}
