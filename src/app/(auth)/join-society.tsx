import { useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';

import { Screen, Text, Field, Button, Card } from '@/components';
import { joinSocietySchema, type JoinSocietyInput } from '@/features/auth/schemas';
import { useAuthStore } from '@/stores/authStore';
import { useSocietyByCode } from '@/queries/useSocietyByCode';
import { useTowersBySociety } from '@/queries/useTowersBySociety';
import { useFlatsByTower } from '@/queries/useFlatsByTower';
import { supabase } from '@/lib/supabase';

export default function JoinSociety() {
  const [societyCode, setSocietyCode] = useState('');
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
      <View style={{ paddingVertical: 32, gap: 24 }}>
        <View style={{ gap: 8 }}>
          <Text variant="titleLarge">Join your society</Text>
          <Text variant="body" color="textSecondary">
            Enter the society code given by your admin
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <Field.Controlled
            control={control}
            name="code"
            label="Society code"
            autoCapitalize="characters"
            placeholder="e.g. PRESTIGE-42"
          />

          {societyLoading && codeValue.length >= 4 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" />
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
          <View style={{ gap: 16 }}>
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

            <View style={{ gap: 12 }}>
              <Text variant="footnote" color="textSecondary">
                Resident type
              </Text>
              <Controller
                control={control}
                name="isOwner"
                render={({ field }) => (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <ToggleChip
                      label="Owner"
                      selected={field.value === true}
                      onPress={() => field.onChange(true)}
                    />
                    <ToggleChip
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
                <Pressable
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  onPress={() => field.onChange(!field.value)}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: field.value ? '#F97066' : '#D1C4BE',
                      backgroundColor: field.value ? '#F97066' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {field.value && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
                  </View>
                  <Text variant="footnote" color="textSecondary">
                    I am the head of the household
                  </Text>
                </Pressable>
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

  return (
    <View style={{ gap: 4 }}>
      <Text variant="footnote" color="textSecondary">
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen(!open)}
        style={{
          minHeight: 48,
          paddingHorizontal: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: error ? '#EF4444' : '#D1C4BE',
          backgroundColor: '#F9F5F3',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
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
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: opt.id === value ? '#FFF0EE' : 'transparent',
                }}
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

interface ToggleChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function ToggleChip({ label, selected, onPress }: ToggleChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: selected ? '#F97066' : '#D1C4BE',
        backgroundColor: selected ? '#FFF0EE' : 'transparent',
      }}
    >
      <Text variant="subhead" color={selected ? 'coral' : 'textSecondary'}>
        {label}
      </Text>
    </Pressable>
  );
}
