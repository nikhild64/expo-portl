import { Alert, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Field } from '@/components';
import { useCreateFamilyMember } from '@/queries/useFamily';
import { useAuthStore } from '@/stores/authStore';

const familySchema = z.object({
  age: z.string().optional().refine(
    (val) => !val || (/^\d+$/.test(val) && Number(val) > 0 && Number(val) <= 150),
    'Enter a valid age',
  ),
  name: z.string().min(2, 'Enter a name'),
  relation: z.string().optional(),
});

type FamilyInput = z.infer<typeof familySchema>;

interface Props {
  onCreated?: () => void;
}

export function FamilyForm({ onCreated }: Props) {
  const uid = useAuthStore((s) => s.session?.user.id);
  const createFamilyMember = useCreateFamilyMember();
  const { control, handleSubmit } = useForm<FamilyInput>({
    defaultValues: { age: '', name: '', relation: '' },
    resolver: zodResolver(familySchema),
  });

  const submit = async (input: FamilyInput) => {
    if (!uid) return;
    try {
      await createFamilyMember.mutateAsync({
        age: input.age ? Number(input.age) : null,
        name: input.name.trim(),
        profile_id: uid,
        relation: input.relation?.trim() || null,
      });
      onCreated?.();
    } catch (error) {
      Alert.alert('Could not add family member', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View className="gap-md">
      <Field.Controlled control={control} name="name" label="Name" />
      <Field.Controlled control={control} name="relation" label="Relation" />
      <Field.Controlled control={control} name="age" label="Age" keyboardType="number-pad" />
      <Button label="Add family member" loading={createFamilyMember.isPending} onPress={handleSubmit(submit)} />
    </View>
  );
}
