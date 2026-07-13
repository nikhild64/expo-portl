import { View } from 'react-native';
import { alert } from '@/lib/alert';
import * as ImagePicker from 'expo-image-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Avatar, Button, Field } from '@/components';
import { supabase } from '@/lib/supabase';
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

async function uploadAvatar(uri: string, uid: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const path = `${uid}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('avatars').upload(path, blob, {
    contentType: 'image/jpeg',
  });
  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

export function ProfileEditForm({ onSaved, profile }: Props) {
  const { t } = useTranslation();
  const profileSchema = useMemo(() => createProfileSchema(t), [t]);
  const uid = useAuthStore((s) => s.session?.user.id);
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
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled) return;

    try {
      const avatarUrl = await uploadAvatar(result.assets[0].uri, uid);
      await updateProfile.mutateAsync({
        avatarUrl,
        fullName: profile.full_name,
        phone: profile.phone,
      });
    } catch (error) {
      alert(
        t('alert.titles.avatarUploadFailed'),
        error instanceof Error ? error.message : t('common.pleaseTryAgain'),
      );
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
      alert(
        t('alert.titles.profileUpdateFailed'),
        error instanceof Error ? error.message : t('common.pleaseTryAgain'),
      );
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
          loading={updateProfile.isPending}
          onPress={pickAvatar}
        />
      </View>
      <Field.Controlled control={control} name="fullName" label={t('resident.profile.fullName')} />
      <Field.Controlled control={control} name="phone" label={t('common.phone')} keyboardType="phone-pad" />
      <Button label={t('resident.profile.saveProfile')} loading={updateProfile.isPending} onPress={handleSubmit(submit)} />
    </View>
  );
}
