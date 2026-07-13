import { View } from 'react-native';
import { alert } from '@/lib/alert';
import * as ImagePicker from 'expo-image-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Avatar, Button, Field } from '@/components';
import { supabase } from '@/lib/supabase';
import { useUpdateProfile } from '@/queries/useUpdateProfile';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  phone: z.string().optional(),
});

type ProfileInput = z.infer<typeof profileSchema>;

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
      alert('Avatar upload failed', error instanceof Error ? error.message : 'Please try again.');
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
      alert('Profile update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View className="gap-lg">
      <View className="items-center gap-sm">
        <Avatar name={profile.full_name} uri={profile.avatar_url ?? undefined} size="xl" />
        <Button label="Change avatar" variant="outlined" icon="photo_camera" loading={updateProfile.isPending} onPress={pickAvatar} />
      </View>
      <Field.Controlled control={control} name="fullName" label="Full name" />
      <Field.Controlled control={control} name="phone" label="Phone" keyboardType="phone-pad" />
      <Button label="Save profile" loading={updateProfile.isPending} onPress={handleSubmit(submit)} />
    </View>
  );
}
