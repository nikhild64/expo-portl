import { Alert, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';

import { Button, Chip, Field, Text } from '@/components';
import { supabase } from '@/lib/supabase';
import { uploadToStorage } from '@/lib/upload';
import { useCreateComplaint } from '@/queries/useComplaints';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

const complaintSchema = z.object({
  category: z.string().min(2, 'Select a category'),
  description: z.string().min(10, 'Describe the issue'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  title: z.string().min(3, 'Enter a title'),
});

type ComplaintInput = z.infer<typeof complaintSchema>;

const categories = ['plumbing', 'electrical', 'housekeeping', 'security', 'parking'];
const priorities: Tables<'complaints'>['priority'][] = ['low', 'medium', 'high', 'urgent'];

async function uploadComplaintPhoto(uri: string, uid: string) {
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  await uploadToStorage('complaint-photos', uri, path);
  return supabase.storage.from('complaint-photos').getPublicUrl(path).data.publicUrl;
}

interface Props {
  onCreated: (id: string) => void;
}

export function ComplaintForm({ onCreated }: Props) {
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

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to attach complaint photos.');
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
      Alert.alert('Flat required', 'Join a flat before raising complaints.');
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
      Alert.alert('Could not create complaint', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View className="gap-lg">
      <Field.Controlled control={control} name="title" label="Title" placeholder="Water leak from ceiling" />
      <Field.Controlled control={control} name="description" label="Description" multiline />

      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          CATEGORY
        </Text>
        <Controller
          control={control}
          name="category"
          render={() => (
            <View className="flex-row flex-wrap gap-sm">
              {categories.map((item) => (
                <Chip key={item} label={item} selected={category === item} onPress={() => setValue('category', item)} />
              ))}
            </View>
          )}
        />
      </View>

      <View className="gap-sm">
        <Text variant="caption" color="textSecondary">
          PRIORITY
        </Text>
        <View className="flex-row flex-wrap gap-sm">
          {priorities.map((item) => (
            <Chip key={item} label={item} selected={priority === item} onPress={() => setValue('priority', item)} />
          ))}
        </View>
      </View>

      <View className="flex-row gap-sm">
        <Button label="Take photo" variant="outlined" icon="photo_camera" full onPress={takePhoto} disabled={photoUris.length >= 4} />
        <Button
          label={photoUris.length ? `${photoUris.length} selected` : 'Choose photos'}
          variant="outlined"
          full
          onPress={pickPhotos}
          disabled={photoUris.length >= 4}
        />
      </View>
      <Button label="Raise complaint" loading={createComplaint.isPending} onPress={handleSubmit(submit)} />
    </View>
  );
}
