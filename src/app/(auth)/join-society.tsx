import { useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';

import { Screen, Text, Field, Button, Card, Checkbox, Chip } from '@/components';
import { joinSocietySchema, type JoinSocietyInput } from '@/features/auth/schemas';
import { useAuthStore } from '@/stores/authStore';
import { useSocietyByCode } from '@/queries/useSocietyByCode';
import { useTowersBySociety } from '@/queries/useTowersBySociety';
import { useFlatsByTower } from '@/queries/useFlatsByTower';
import { supabase } from '@/lib/supabase';

export default function JoinSociety() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const session = useAuthStore((s) => s.session);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<JoinSocietyInput>({
    resolver: zodResolver(joinSocietySchema),
    defaultValues: {
      code: '',
      towerId: '',
      flatId: '',
      isOwner: true,
      isHead: false,
    },
  });

  const codeValue = watch('code');
  const towerIdValue = watch('towerId');

  const { data: society, isFetching: societyLoading } = useSocietyByCode(codeValue);
  const { data: towers = [], isFetching: towersLoading } = useTowersBySociety(society?.id);
  const { data: flats = [], isFetching: flatsLoading } = useFlatsByTower(towerIdValue || null);

  const onSubmit = handleSubmit(async ({ towerId: _t, flatId, isOwner, isHead }) => {
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

  return (
    <Screen scroll>
      <View className="gap-lg py-xl">
        <View className="gap-xs">
          <Text variant="titleLarge">Join your society</Text>
          <Text variant="body" color="textSecondary">
            Enter the society code given by your admin
          </Text>
        </View>

        <View className="gap-base">
          <Field.Controlled
            control={control}
            name="code"
            label="Society code"
            autoCapitalize="characters"
            placeholder="e.g. PRESTIGE-42"
          />

          {societyLoading && codeValue.length >= 4 && (
            <View className="flex-row items-center gap-xs">
              <ActivityIndicator size="small" colorClassName="accent-coral" />
              <Text variant="footnote" color="textSecondary">
                Looking up society…
              </Text>
            </View>
          )}

          {codeValue.length >= 4 && !societyLoading && !society && (
            <Text variant="footnote" color="error">
              No society found with that code
            </Text>
          )}

          {society && (
            <Card variant="filled">
              <Text variant="headline">{society.name}</Text>
              {society.city && (
                <Text variant="footnote" color="textSecondary">
                  {society.city}
                </Text>
              )}
              {society.address && (
                <Text variant="footnote" color="textSecondary">
                  {society.address}
                </Text>
              )}
            </Card>
          )}
        </View>

        {society && (
          <View className="gap-base">
            <SelectField
              label="Tower"
              placeholder="Select a tower"
              loading={towersLoading}
              options={towers.map((t) => ({ id: t.id, label: t.name }))}
              value={towerIdValue}
              onChange={(id) => {
                setValue('towerId', id, { shouldValidate: true });
                setValue('flatId', '', { shouldValidate: false });
              }}
            />

            {towerIdValue && (
              <Controller
                control={control}
                name="flatId"
                render={({ field, fieldState }) => (
                  <SelectField
                    label="Flat"
                    placeholder="Select a flat"
                    loading={flatsLoading}
                    options={flats.map((f) => ({ id: f.id, label: f.number }))}
                    value={field.value}
                    onChange={(id) => field.onChange(id)}
                    error={fieldState.error?.message}
                  />
                )}
              />
            )}

            <View className="gap-sm">
              <Text variant="footnote" color="textSecondary">
                Resident type
              </Text>
              <Controller
                control={control}
                name="isOwner"
                render={({ field }) => (
                  <View className="flex-row gap-sm">
                    <Chip
                      label="Owner"
                      selected={field.value === true}
                      onPress={() => field.onChange(true)}
                    />
                    <Chip
                      label="Tenant"
                      selected={field.value === false}
                      onPress={() => field.onChange(false)}
                    />
                  </View>
                )}
              />
            </View>

            <Controller
              control={control}
              name="isHead"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onPress={() => field.onChange(!field.value)}
                  label="I am the head of the household"
                />
              )}
            />
          </View>
        )}

        {submitError && (
          <Text variant="footnote" color="error">
            {submitError}
          </Text>
        )}

        {society && (
          <Button
            label="Join society"
            onPress={onSubmit}
            loading={isSubmitting}
            full
            icon="arrow_forward"
            iconPosition="right"
          />
        )}
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
      {open && options.length > 0 && (
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
      )}
      {error && (
        <Text variant="footnote" color="error">
          {error}
        </Text>
      )}
    </View>
  );
}
