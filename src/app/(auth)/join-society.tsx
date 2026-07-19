import { useMemo, useState, useEffect } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';

import { Screen, Text, Field, Button, Card, ThemeSwitch, SegmentedControl } from '@/components';
import { SignupWizardChrome } from '@/features/auth/SignupWizardChrome';
import { SocietyPreviewCard } from '@/features/auth/SocietyPreviewCard';
import {
  createAuthSchemas,
  type JoinGuardSocietyInput,
  type JoinSocietyInput,
} from '@/features/auth/schemas';
import { useLocale } from '@/hooks/useLocale';
import { useAuthStore } from '@/stores/authStore';
import { useSocietyByCode } from '@/queries/useSocietyByCode';
import { SocietySearchField } from '@/features/auth/SocietySearchField';
import { useTowersBySociety } from '@/queries/useTowersBySociety';
import { useFlatsByTower } from '@/queries/useFlatsByTower';
import { useCheckFamilyInvite, useConsumeFamilyInvite } from '@/queries/useFamily';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Society = Database['public']['Tables']['societies']['Row'];
type LookupMode = 'code' | 'search';

export default function JoinSociety() {
  const { t } = useLocale();
  const { joinSocietySchema, joinGuardSocietySchema } = useMemo(() => createAuthSchemas(t), [t]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lookupMode, setLookupMode] = useState<LookupMode>('code');
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const isGuard = profile?.role === 'guard';

  const residentForm = useForm<JoinSocietyInput>({
    resolver: zodResolver(joinSocietySchema),
    defaultValues: {
      code: '',
      towerId: '',
      flatId: '',
      isOwner: true,
      isHead: true,
    },
  });

  const guardForm = useForm<JoinGuardSocietyInput>({
    resolver: zodResolver(joinGuardSocietySchema),
    defaultValues: {
      code: '',
    },
  });

  const codeValue = isGuard ? guardForm.watch('code') : residentForm.watch('code');
  const towerIdValue = isGuard ? '' : residentForm.watch('towerId');
  const isOwnerValue = isGuard ? true : residentForm.watch('isOwner');
  const [ignoreInvite, setIgnoreInvite] = useState(false);

  const setResidentValue = residentForm.setValue;
  useEffect(() => {
    if (isGuard) return;
    setResidentValue('isHead', isOwnerValue, { shouldValidate: true });
  }, [isGuard, isOwnerValue, setResidentValue]);

  const setCodeValue = (code: string, options?: { shouldValidate?: boolean }) => {
    if (isGuard) {
      guardForm.setValue('code', code, options);
      return;
    }
    residentForm.setValue('code', code, options);
  };

  const { data: societyByCode, isFetching: societyLoading } = useSocietyByCode(
    lookupMode === 'code' || codeValue ? codeValue : '',
  );
  const society = societyByCode;

  const { data: towers = [], isFetching: towersLoading } = useTowersBySociety(society?.id);
  const { data: flats = [], isFetching: flatsLoading } = useFlatsByTower(towerIdValue || null);

  const { data: familyInvite, isFetching: inviteLoading } = useCheckFamilyInvite({
    enabled: !isGuard,
  });
  const consumeInvite = useConsumeFamilyInvite();

  const handleConfirmInvite = async (societyId?: string) => {
    const targetSocietyId = societyId || society?.id;
    if (!targetSocietyId || !session) return;
    setSubmitError(null);
    useAuthStore.getState().beginAuthTransition('joinSociety');

    try {
      const res = await consumeInvite.mutateAsync(targetSocietyId);
      if (res.ok) {
        await refreshProfile({ force: true });
        router.replace('/(resident)');
        setTimeout(() => useAuthStore.getState().endAuthTransition(), 400);
      } else {
        throw new Error(res.reason || t('auth.joinSociety.failed'));
      }
    } catch (e: unknown) {
      useAuthStore.getState().endAuthTransition({ immediate: true });
      const msg = e instanceof Error ? e.message : t('auth.joinSociety.failed');
      setSubmitError(msg);
    }
  };

  const linkProfileToSociety = async (societyId: string) => {
    if (!session) return;

    const { data, error } = await supabase
      .from('profiles')
      .update({ society_id: societyId })
      .eq('id', session.user.id)
      .select('society_id')
      .single();
    if (error) throw error;
    if (data?.society_id !== societyId) {
      throw new Error(t('auth.joinSociety.failed'));
    }
  };

  const finishJoin = async () => {
    await refreshProfile({ force: true });
    router.replace('/(auth)/pending-approval');
    setTimeout(() => useAuthStore.getState().endAuthTransition(), 400);
  };

  const joinGuard = guardForm.handleSubmit(async () => {
    if (!society || !session) return;
    setSubmitError(null);
    useAuthStore.getState().beginAuthTransition('joinSociety');

    try {
      await linkProfileToSociety(society.id);
      await finishJoin();
    } catch (e: unknown) {
      useAuthStore.getState().endAuthTransition({ immediate: true });
      const msg = e instanceof Error ? e.message : t('auth.joinSociety.failed');
      setSubmitError(msg);
    }
  });

  const joinResident = residentForm.handleSubmit(async ({ flatId, isOwner, isHead }) => {
    if (!society || !session) return;
    setSubmitError(null);
    useAuthStore.getState().beginAuthTransition('joinSociety');

    try {
      await linkProfileToSociety(society.id);

      const { error: flatError } = await supabase.from('flat_residents').insert({
        flat_id: flatId,
        profile_id: session.user.id,
        is_owner: isOwner,
        is_head: isHead,
      });
      if (flatError) throw flatError;

      await finishJoin();
    } catch (e: unknown) {
      useAuthStore.getState().endAuthTransition({ immediate: true });
      const msg = e instanceof Error ? e.message : t('auth.joinSociety.failed');
      setSubmitError(msg);
    }
  });

  const resetSocietyFields = () => {
    setCodeValue('', { shouldValidate: false });
    if (!isGuard) {
      residentForm.setValue('towerId', '', { shouldValidate: false });
      residentForm.setValue('flatId', '', { shouldValidate: false });
    }
  };

  const handleModeChange = (mode: LookupMode) => {
    setLookupMode(mode);
    resetSocietyFields();
  };

  const handleSelectSociety = (selected: Society) => {
    setCodeValue(selected.code, { shouldValidate: true });
    if (!isGuard) {
      residentForm.setValue('towerId', '', { shouldValidate: false });
      residentForm.setValue('flatId', '', { shouldValidate: false });
    }
  };

  const showInvite = familyInvite && !ignoreInvite && !isGuard;

  if (inviteLoading && !isGuard && !ignoreInvite) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center py-xl">
          <ActivityIndicator size="large" colorClassName="accent-coral" />
          <Text variant="body" color="textSecondary" className="mt-md">
            {t('common.loading') || 'Loading...'}
          </Text>
        </View>
      </Screen>
    );
  }

  if (showInvite) {
    const inviteSociety = (familyInvite as any).flats?.towers?.societies;
    const inviteTowerName = (familyInvite as any).flats?.towers?.name;
    const inviteFlatNumber = (familyInvite as any).flats?.number;

    return (
      <Screen scroll>
        <View className="gap-lg py-xl">
          <SignupWizardChrome step={2} />

          <View className="gap-xs">
            <Text variant="titleLarge">{t('auth.joinSociety.preApprovedTitle')}</Text>
            <Text variant="body" color="textSecondary">
              {t('auth.joinSociety.preApprovedMessage')}
            </Text>
          </View>

          <Card variant="elevated" className="bg-success-container border-success gap-sm">
            <Text variant="headline" color="success">
              {inviteSociety?.name}
            </Text>
            <Text variant="body" color="textSecondary">
              {t('auth.joinSociety.tower')}: <Text variant="body" className="font-medium">{inviteTowerName}</Text>
            </Text>
            <Text variant="body" color="textSecondary">
              {t('auth.joinSociety.flatNumber')}: <Text variant="body" className="font-medium">{inviteFlatNumber}</Text>
            </Text>
          </Card>

          <View className="gap-sm">
            <Button
              label={t('auth.joinSociety.confirmJoin')}
              onPress={() => handleConfirmInvite(inviteSociety?.id)}
              disabled={consumeInvite.isPending}
              loading={consumeInvite.isPending}
              full
              icon="check_circle"
            />
            <Button
              label={t('auth.joinSociety.searchSociety') || 'Join a different society'}
              variant="text"
              onPress={() => setIgnoreInvite(true)}
              full
            />
          </View>

          {submitError ? (
            <Text variant="footnote" color="error">
              {submitError}
            </Text>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View className="gap-lg py-xl">
          <SignupWizardChrome step={2} />

          <View className="gap-xs">
            <Text variant="titleLarge">{t('auth.joinSociety.title')}</Text>
            <Text variant="body" color="textSecondary">
              {isGuard
                ? t('auth.joinSociety.guardSubtitle')
                : t('auth.joinSociety.residentSubtitle')}
            </Text>
          </View>

          <SegmentedControl
            segments={[
              { label: t('auth.joinSociety.enterCode'), value: 'code' },
              { label: t('auth.joinSociety.searchSociety'), value: 'search' },
            ]}
            value={lookupMode}
            onChange={handleModeChange}
          />

          <View className="gap-base">
            {lookupMode === 'code' ? (
              isGuard ? (
                <Field.Controlled
                  control={guardForm.control}
                  name="code"
                  label={t('auth.joinSociety.societyCode')}
                  autoCapitalize="characters"
                  placeholder={t('auth.placeholders.societyCode')}
                  helper={t('auth.joinSociety.societyCodeHelper')}
                />
              ) : (
                <Field.Controlled
                  control={residentForm.control}
                  name="code"
                  label={t('auth.joinSociety.societyCode')}
                  autoCapitalize="characters"
                  placeholder={t('auth.placeholders.societyCode')}
                  helper={t('auth.joinSociety.societyCodeHelper')}
                />
              )
            ) : (
              <SocietySearchField
                onClear={resetSocietyFields}
                onSelect={handleSelectSociety}
                selectedLabel={society?.name}
                value={codeValue || undefined}
              />
            )}

            {societyLoading && (lookupMode === 'code' ? codeValue.length >= 4 : !!codeValue) && (
              <View className="flex-row items-center gap-xs">
                <ActivityIndicator size="small" colorClassName="accent-coral" />
                <Text variant="footnote" color="textSecondary">
                  {t('auth.joinSociety.lookingUpSociety')}
                </Text>
              </View>
            )}

            {lookupMode === 'code' && codeValue.length >= 4 && !societyLoading && !society && (
              <Text variant="footnote" color="error">
                {t('auth.joinSociety.noSocietyWithCode')}
              </Text>
            )}

            {society ? <SocietyPreviewCard society={society} /> : null}
          </View>

          {society && !isGuard ? (
            <View className="gap-base">
              <Text variant="headline">{t('auth.joinSociety.yourFlatDetails')}</Text>

              <Controller
                control={residentForm.control}
                name="towerId"
                render={({ field, fieldState }) => (
                  <SelectField
                    label={t('auth.joinSociety.tower')}
                    placeholder={t('auth.joinSociety.selectTower')}
                    loading={towersLoading}
                    options={towers.map((tower) => ({ id: tower.id, label: tower.name }))}
                    value={field.value}
                    onChange={(id) => {
                      field.onChange(id);
                      residentForm.setValue('flatId', '', { shouldValidate: false });
                    }}
                    error={fieldState.error?.message}
                  />
                )}
              />

              {towerIdValue ? (
                <Controller
                  control={residentForm.control}
                  name="flatId"
                  render={({ field, fieldState }) => (
                    <SelectField
                      label={t('auth.joinSociety.flatNumber')}
                      placeholder={t('auth.joinSociety.selectFlat')}
                      loading={flatsLoading}
                      options={flats.map((flat) => ({ id: flat.id, label: flat.number }))}
                      value={field.value}
                      onChange={(id) => field.onChange(id)}
                      error={fieldState.error?.message}
                      searchable
                    />
                  )}
                />
              ) : null}

              <SelectField
                label={t('auth.joinSociety.yourRole')}
                placeholder={t('auth.joinSociety.selectRole')}
                options={[
                  { id: 'owner', label: t('auth.joinSociety.owner') },
                  { id: 'tenant', label: t('auth.joinSociety.tenant') },
                ]}
                value={isOwnerValue ? 'owner' : 'tenant'}
                onChange={(id) => residentForm.setValue('isOwner', id === 'owner', { shouldValidate: true })}
              />

              {isOwnerValue ? (
                <Controller
                  control={residentForm.control}
                  name="isHead"
                  render={({ field }) => (
                    <View className="flex-row items-center justify-between gap-md">
                      <Text variant="body">{t('auth.joinSociety.headOfFamily')}</Text>
                      <ThemeSwitch value={field.value} onValueChange={field.onChange} />
                    </View>
                  )}
                />
              ) : null}
            </View>
          ) : null}

          {submitError ? (
            <Text variant="footnote" color="error">
              {submitError}
            </Text>
          ) : null}

          {society ? (
            <View className="gap-sm">
              <Button
                label={isGuard ? t('auth.joinSociety.requestGuardAccess') : t('auth.joinSociety.requestToJoin')}
                onPress={isGuard ? joinGuard : joinResident}
                disabled={isGuard ? guardForm.formState.isSubmitting : residentForm.formState.isSubmitting}
                full
                icon="send"
                iconPosition="right"
              />
              <Text variant="footnote" color="textSecondary" className="text-center">
                {t('auth.joinSociety.adminApprove24h')}
              </Text>
            </View>
          ) : null}
        </View>
    </Screen>
  );
}

interface SelectFieldProps {
  label: string;
  placeholder: string;
  loading?: boolean;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
  searchable?: boolean;
}

function SelectField({
  label,
  placeholder,
  loading,
  options,
  value,
  onChange,
  error,
  searchable,
}: SelectFieldProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selected = options.find((o) => o.id === value);
  const borderClass = error ? 'border-error' : 'border-border';

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery, searchable]);

  return (
    <View className="gap-xs">
      <Text variant="footnote" color="textSecondary">
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen(!open)}
        className={`min-h-[48px] flex-row items-center justify-between rounded-md border bg-surface px-base ${borderClass}`}
      >
        <Text variant="body" color={selected ? 'textPrimary' : 'textSecondary'}>
          {loading ? t('common.loading') : selected ? selected.label : placeholder}
        </Text>
        <Text color="textSecondary">{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && options.length > 0 ? (
        <Card variant="elevated" padding="none">
          {searchable && (
            <View className="border-b border-border p-xs">
              <TextInput
                placeholder={t('common.search') || 'Search...'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="h-9 rounded-md border border-border bg-surface-secondary px-sm text-sm text-text-primary"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  borderCurve: 'continuous',
                  fontFamily: 'RobotoFlex-Regular',
                }}
              />
            </View>
          )}
          <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={`px-base py-md ${opt.id === value ? 'bg-surface-secondary' : 'bg-transparent'}`}
                >
                  <Text variant="body" color={opt.id === value ? 'coral' : 'textPrimary'}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))
            ) : (
              <View className="px-base py-md">
                <Text variant="body" color="textSecondary">
                  {t('auth.joinSociety.noFlatsFound') || 'No flats found'}
                </Text>
              </View>
            )}
          </ScrollView>
        </Card>
      ) : null}
      {error ? (
        <Text variant="footnote" color="error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
