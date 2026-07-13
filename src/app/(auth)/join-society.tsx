import { useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { ScopedTheme } from 'uniwind';

import { Screen, Text, Field, Button, Card, ThemeSwitch, SegmentedControl } from '@/components';
import { SignupWizardChrome } from '@/features/auth/SignupWizardChrome';
import { SocietyPreviewCard } from '@/features/auth/SocietyPreviewCard';
import {
  joinGuardSocietySchema,
  joinSocietySchema,
  type JoinGuardSocietyInput,
  type JoinSocietyInput,
} from '@/features/auth/schemas';
import { useAuthStore } from '@/stores/authStore';
import { useSocietyByCode } from '@/queries/useSocietyByCode';
import { useSocietySearch } from '@/queries/useSocietySearch';
import { useTowersBySociety } from '@/queries/useTowersBySociety';
import { useFlatsByTower } from '@/queries/useFlatsByTower';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Society = Database['public']['Tables']['societies']['Row'];
type LookupMode = 'code' | 'search';

export default function JoinSociety() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lookupMode, setLookupMode] = useState<LookupMode>('code');
  const [searchQuery, setSearchQuery] = useState('');
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

  const form = isGuard ? guardForm : residentForm;
  const codeValue = form.watch('code');
  const towerIdValue = isGuard ? '' : residentForm.watch('towerId');
  const isOwnerValue = isGuard ? true : residentForm.watch('isOwner');

  const { data: societyByCode, isFetching: codeLoading } = useSocietyByCode(
    lookupMode === 'code' ? codeValue : '',
  );
  const { data: searchResults = [], isFetching: searchLoading } = useSocietySearch(
    lookupMode === 'search' ? searchQuery : '',
  );

  const society: Society | null | undefined =
    lookupMode === 'code' ? societyByCode : searchResults.find((item) => item.code === codeValue) ?? null;

  const societyLoading = lookupMode === 'code' ? codeLoading : searchLoading;

  const { data: towers = [], isFetching: towersLoading } = useTowersBySociety(society?.id);
  const { data: flats = [], isFetching: flatsLoading } = useFlatsByTower(towerIdValue || null);

  const joinGuard = guardForm.handleSubmit(async () => {
    if (!society || !session) return;
    setSubmitError(null);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ society_id: society.id })
        .eq('id', session.user.id);
      if (profileError) throw profileError;

      await refreshProfile();
      router.replace('/(auth)/pending-approval');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to join society';
      setSubmitError(msg);
    }
  });

  const joinResident = residentForm.handleSubmit(async ({ flatId, isOwner, isHead }) => {
    if (!society || !session) return;
    setSubmitError(null);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ society_id: society.id })
        .eq('id', session.user.id);
      if (profileError) throw profileError;

      const { error: flatError } = await supabase.from('flat_residents').insert({
        flat_id: flatId,
        profile_id: session.user.id,
        is_owner: isOwner,
        is_head: isHead,
      });
      if (flatError) throw flatError;

      await refreshProfile();
      router.replace('/(auth)/pending-approval');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to join society';
      setSubmitError(msg);
    }
  });

  const resetSocietyFields = () => {
    form.setValue('code', '', { shouldValidate: false });
    if (!isGuard) {
      residentForm.setValue('towerId', '', { shouldValidate: false });
      residentForm.setValue('flatId', '', { shouldValidate: false });
    }
  };

  const handleModeChange = (mode: LookupMode) => {
    setLookupMode(mode);
    resetSocietyFields();
    setSearchQuery('');
  };

  const handleSelectSociety = (selected: Society) => {
    form.setValue('code', selected.code, { shouldValidate: true });
    if (!isGuard) {
      residentForm.setValue('towerId', '', { shouldValidate: false });
      residentForm.setValue('flatId', '', { shouldValidate: false });
    }
  };

  return (
    <ScopedTheme theme="dark">
      <Screen scroll className="bg-bg">
        <View className="gap-lg py-xl">
          <SignupWizardChrome step={2} />

          <View className="gap-xs">
            <Text variant="titleLarge">Find your society</Text>
            <Text variant="body" color="textSecondary">
              {isGuard
                ? 'Your society admin must approve guard access before you can sign in'
                : 'We will ask your society admin to approve your join request'}
            </Text>
          </View>

          <SegmentedControl
            variant="onDark"
            segments={[
              { label: 'Enter code', value: 'code' },
              { label: 'Search society', value: 'search' },
            ]}
            value={lookupMode}
            onChange={handleModeChange}
          />

          <View className="gap-base">
            {lookupMode === 'code' ? (
              <Field.Controlled
                control={form.control}
                name="code"
                label="Society code"
                autoCapitalize="characters"
                placeholder="e.g. PRESTIGE-42"
                helper="Ask your society admin for the code"
              />
            ) : (
              <View className="gap-sm">
                <Field
                  label="Search by name or city"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    resetSocietyFields();
                  }}
                  placeholder="e.g. Prestige Meadows"
                  autoCapitalize="words"
                />

                {searchLoading && searchQuery.length >= 2 && (
                  <View className="flex-row items-center gap-xs">
                    <ActivityIndicator size="small" colorClassName="accent-coral" />
                    <Text variant="footnote" color="textSecondary">
                      Searching societies…
                    </Text>
                  </View>
                )}

                {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
                  <Text variant="footnote" color="error">
                    No societies found
                  </Text>
                )}

                {searchResults.length > 0 && !society && (
                  <Card variant="outlined" padding="none">
                    <ScrollView style={{ maxHeight: 220 }}>
                      {searchResults.map((result) => (
                        <Pressable
                          key={result.id}
                          onPress={() => handleSelectSociety(result)}
                          className="border-b border-border px-base py-md"
                        >
                          <Text variant="body">{result.name}</Text>
                          {result.city ? (
                            <Text variant="footnote" color="textSecondary">
                              {result.city}
                            </Text>
                          ) : null}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </Card>
                )}
              </View>
            )}

            {societyLoading && (lookupMode === 'code' ? codeValue.length >= 4 : searchQuery.length >= 2) && (
              <View className="flex-row items-center gap-xs">
                <ActivityIndicator size="small" colorClassName="accent-coral" />
                <Text variant="footnote" color="textSecondary">
                  Looking up society…
                </Text>
              </View>
            )}

            {lookupMode === 'code' && codeValue.length >= 4 && !societyLoading && !society && (
              <Text variant="footnote" color="error">
                No society found with that code
              </Text>
            )}

            {society ? <SocietyPreviewCard society={society} /> : null}
          </View>

          {society && !isGuard ? (
            <View className="gap-base">
              <Text variant="headline">Your flat details</Text>

              <SelectField
                label="Tower"
                placeholder="Select a tower"
                loading={towersLoading}
                options={towers.map((t) => ({ id: t.id, label: t.name }))}
                value={towerIdValue}
                onChange={(id) => {
                  residentForm.setValue('towerId', id, { shouldValidate: true });
                  residentForm.setValue('flatId', '', { shouldValidate: false });
                }}
              />

              {towerIdValue ? (
                <Controller
                  control={residentForm.control}
                  name="flatId"
                  render={({ field, fieldState }) => (
                    <SelectField
                      label="Flat number"
                      placeholder="Select a flat"
                      loading={flatsLoading}
                      options={flats.map((f) => ({ id: f.id, label: f.number }))}
                      value={field.value}
                      onChange={(id) => field.onChange(id)}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              ) : null}

              <SelectField
                label="Your role"
                placeholder="Select your role"
                options={[
                  { id: 'owner', label: 'Owner' },
                  { id: 'tenant', label: 'Tenant' },
                ]}
                value={isOwnerValue ? 'owner' : 'tenant'}
                onChange={(id) => residentForm.setValue('isOwner', id === 'owner', { shouldValidate: true })}
              />

              <Controller
                control={residentForm.control}
                name="isHead"
                render={({ field }) => (
                  <View className="flex-row items-center justify-between gap-md">
                    <Text variant="body">Head of family</Text>
                    <ThemeSwitch value={field.value} onValueChange={field.onChange} />
                  </View>
                )}
              />
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
                label={isGuard ? 'Request guard access' : 'Request to join'}
                onPress={isGuard ? joinGuard : joinResident}
                loading={isGuard ? guardForm.formState.isSubmitting : residentForm.formState.isSubmitting}
                full
                icon="send"
                iconPosition="right"
              />
              <Text variant="footnote" color="textSecondary" className="text-center">
                Admin will approve within 24h
              </Text>
            </View>
          ) : null}
        </View>
      </Screen>
    </ScopedTheme>
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
}

function SelectField({ label, placeholder, loading, options, value, onChange, error }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);
  const borderClass = error ? 'border-error' : 'border-border';

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
          {loading ? 'Loading…' : selected ? selected.label : placeholder}
        </Text>
        <Text color="textSecondary">{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && options.length > 0 ? (
        <Card variant="elevated" padding="none">
          <ScrollView style={{ maxHeight: 200 }}>
            {options.map((opt) => (
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
            ))}
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
