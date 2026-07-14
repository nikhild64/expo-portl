import { View } from 'react-native';
import { alertError } from '@/lib/alert';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Avatar, Button, Field } from '@/components';
import { pickGalleryPhotos, storageImagePath, uploadPublicImage } from '@/lib/imageUpload';
import { useUpdateProfile } from '@/queries/useUpdateProfile';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

function createProfileSchema(t: TFunction) {
  return z.object({
    fullName: z.string().min(2, t('validation.fullNameRequired')),
    phone: z.string().optional(),
  });
}

type ProfileInput = z.infer<ReturnType<typeof createProfileSchema>>;

interface Props {
  onSaved?: () => void;
  profile: Tables<'profiles'>;
}

export function ProfileEditForm({ onSaved, profile }: Props) {
  const { t } = useTranslation();
  const profileSchema = useMemo(() => createProfileSchema(t), [t]);
  const uid = useAuthStore((s) => s.session?.user.id);
  const email = useAuthStore((s) => s.session?.user.email);
  const updateProfile = useUpdateProfile();
  const { control, handleSubmit } = useForm<ProfileInput>({
    defaultValues: {
      fullName: profile.full_name,
      phone: profile.phone ?? '',
    },
    resolver: zodResolver(profileSchema),
  });

  const pickAvatar = async () => {
    if (!uid) return;
    const [uri] = await pickGalleryPhotos({ allowsEditing: true, aspect: [1, 1] });
    if (!uri) return;

    try {
      const avatarUrl = await uploadPublicImage('avatars', uri, storageImagePath(uid), { width: 512, compress: 0.8 });
      await updateProfile.mutateAsync({
        avatarUrl,
        fullName: profile.full_name,
        phone: profile.phone,
      });
    } catch (error) {
      alertError(t('alert.titles.avatarUploadFailed'), error);
    }
  };

  const submit = async (input: ProfileInput) => {
    try {
      await updateProfile.mutateAsync({
        avatarUrl: profile.avatar_url,
        fullName: input.fullName.trim(),
        phone: input.phone?.trim() || null,
      });
      onSaved?.();
    } catch (error) {
      alertError(t('alert.titles.profileUpdateFailed'), error);
    }
  };

  return (
    <View className="gap-lg">
      <View className="items-center gap-sm">
        <Avatar name={profile.full_name} uri={profile.avatar_url ?? undefined} size="xl" />
        <Button
          label={t('resident.profile.changeAvatar')}
          variant="outlined"
          icon="photo_camera"
          onPress={pickAvatar}
        />
      </View>
      <Field.Controlled control={control} name="fullName" label={t('common.name')} />
      <Field
        label={t('common.email')}
        value={email ?? ''}
        editable={false}
        helper={t('resident.profile.emailReadOnly')}
      />
      <Field.Controlled control={control} name="phone" label={t('common.phone')} keyboardType="phone-pad" />
      <Button label={t('common.save')} onPress={handleSubmit(submit)} loading={updateProfile.isPending} />
    </View>
  );
}
