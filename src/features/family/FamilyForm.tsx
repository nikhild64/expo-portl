import { View } from 'react-native';
import { alertError } from '@/lib/alert';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Field } from '@/components';
import { useCreateFamilyMember } from '@/queries/useFamily';
import { useAuthStore } from '@/stores/authStore';

function createFamilySchema(t: TFunction) {
  return z.object({
    age: z.string().optional().refine(
      (val) => !val || (/^\d+$/.test(val) && Number(val) > 0 && Number(val) <= 150),
      t('validation.minPassword'),
    ),
    name: z.string().min(2, t('validation.fullNameRequired')),
    relation: z.string().optional(),
  });
}

type FamilyInput = z.infer<ReturnType<typeof createFamilySchema>>;

interface Props {
  onCreated?: () => void;
}

export function FamilyForm({ onCreated }: Props) {
  const { t } = useTranslation();
  const familySchema = useMemo(() => createFamilySchema(t), [t]);
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
      alertError(t('alert.titles.couldNotAddFamily'), error);
    }
  };

  return (
    <View className="gap-md">
      <Field.Controlled control={control} name="name" label={t('common.name')} />
      <Field.Controlled control={control} name="relation" label={t('resident.family.relation')} />
      <Field.Controlled control={control} name="age" label={t('resident.family.age')} keyboardType="number-pad" />
      <Button label={t('resident.family.addFamilyMember')} loading={createFamilyMember.isPending} onPress={handleSubmit(submit)} />
    </View>
  );
}
