import { Pressable, View } from 'react-native';
import { alertError } from '@/lib/alert';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button, Field, Sheet, useSheet, Text } from '@/components';
import { useCreateFamilyMember } from '@/queries/useFamily';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { useAuthStore } from '@/stores/authStore';

function createFamilySchema(t: TFunction) {
  return z.object({
    age: z.string().optional().refine(
      (val) => !val || (/^\d+$/.test(val) && Number(val) > 0 && Number(val) <= 150),
      t('validation.invalidAge') || 'Please enter a valid age (1–150)',
    ),
    name: z.string().min(2, t('validation.fullNameRequired')),
    relation: z.string().min(1, t('validation.selectPurpose') || 'Select a relation'),
    email: z.string().email(t('validation.invalidEmail')).or(z.literal('')),
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
  const { data: primaryFlat } = useMyPrimaryFlat();
  const createFamilyMember = useCreateFamilyMember();
  const { control, handleSubmit, setValue } = useForm<FamilyInput>({
    defaultValues: { age: '', name: '', relation: '', email: '' },
    resolver: zodResolver(familySchema),
  });

  const relationSheet = useSheet();

  const relationOptions = useMemo(() => [
    { key: 'spouse', label: t('resident.family.relations.spouse') },
    { key: 'father', label: t('resident.family.relations.father') },
    { key: 'mother', label: t('resident.family.relations.mother') },
    { key: 'son', label: t('resident.family.relations.son') },
    { key: 'daughter', label: t('resident.family.relations.daughter') },
    { key: 'brother', label: t('resident.family.relations.brother') },
    { key: 'sister', label: t('resident.family.relations.sister') },
  ], [t]);

  const submit = async (input: FamilyInput) => {
    if (!uid) return;
    try {
      await createFamilyMember.mutateAsync({
        age: input.age ? Number(input.age) : null,
        name: input.name.trim(),
        profile_id: uid,
        relation: input.relation.trim(),
        email: input.email?.trim() || null,
        flat_id: input.email?.trim() && primaryFlat ? primaryFlat.flat_id : null,
      });
      onCreated?.();
    } catch (error) {
      alertError(t('alert.titles.couldNotAddFamily'), error);
    }
  };

  return (
    <View className="gap-md">
      <Field.Controlled control={control} name="name" label={t('common.name')} />
      
      <Controller
        control={control}
        name="relation"
        render={({ field, fieldState }) => {
          const borderClass = fieldState.error ? 'border-error' : 'border-border';
          const selectedOption = relationOptions.find((o) => o.label === field.value);

          return (
            <View className="gap-xs">
              <Text variant="footnote" color="textSecondary">
                {t('resident.family.relation')}
              </Text>
              <Pressable
                onPress={relationSheet.present}
                className={`min-h-[48px] flex-row items-center justify-between rounded-md border bg-surface px-base ${borderClass}`}
              >
                <Text variant="body" color={field.value ? 'textPrimary' : 'textSecondary'}>
                  {selectedOption ? selectedOption.label : t('resident.family.selectRelation')}
                </Text>
                <Text color="textSecondary">▼</Text>
              </Pressable>
              {fieldState.error && (
                <Text variant="footnote" color="error">
                  {fieldState.error.message}
                </Text>
              )}
            </View>
          );
        }}
      />

      <Field.Controlled control={control} name="age" label={t('resident.family.age')} keyboardType="number-pad" />
      <Field.Controlled control={control} name="email" label={t('common.email')} helper={t('resident.family.emailHelper')} autoCapitalize="none" keyboardType="email-address" />
      <Button label={t('resident.family.addFamilyMember')} loading={createFamilyMember.isPending} onPress={handleSubmit(submit)} />

      <Sheet ref={relationSheet.ref} snapPoints={['45%']}>
        <View className="gap-sm py-sm">
          <Text variant="title" className="mb-xs">
            {t('resident.family.relation')}
          </Text>
          {relationOptions.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => {
                setValue('relation', opt.label, { shouldValidate: true });
                relationSheet.dismiss();
              }}
              className="min-h-[48px] justify-center border-b border-border px-xs"
            >
              <Text variant="body">{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </View>
  );
}
