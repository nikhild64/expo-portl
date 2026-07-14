import { View } from 'react-native';
import { alertError } from '@/lib/alert';
import { Image } from 'expo-image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Card, Field, Text } from '@/components';
import {
  pickGalleryPhotos,
  pickImageSourceI18n,
  takeCameraPhoto,
  uploadPublicImage,
} from '@/lib/imageUpload';
import { SOCIETY_LOGOS_BUCKET } from '@/lib/storage';
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

  const applyLogo = async (uri: string) => {
    setUploadingLogo(true);
    try {
      const publicUrl = await uploadPublicImage(SOCIETY_LOGOS_BUCKET, uri, `${society.id}/${Date.now()}.jpg`, {
        width: 512,
        compress: 0.85,
      });
      setValue('logoUrl', publicUrl, { shouldDirty: true });
    } catch (error) {
      alertError(t('alert.titles.logoUploadFailed'), error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const chooseLogoSource = () => {
    pickImageSourceI18n(t, {
      titleKey: 'alert.titles.changeLogo',
      messageKey: 'alert.messages.chooseSetLogo',
      onCamera: async () => {
        const uri = await takeCameraPhoto({ allowsEditing: true, aspect: [1, 1] });
        if (uri) await applyLogo(uri);
      },
      onGallery: async () => {
        const [uri] = await pickGalleryPhotos({ allowsEditing: true, aspect: [1, 1] });
        if (uri) await applyLogo(uri);
      },
    });
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
