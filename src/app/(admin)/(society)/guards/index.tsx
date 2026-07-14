import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Chip, EmptyState, Field, Screen, ScreenLoading, Text } from '@/components';
import { SmallGapSeparator } from '@/components/listSeparators';
import { GuardRow } from '@/features/admin/GuardRow';
import { useAdminGuards, type GuardStatusFilter } from '@/queries/useAdminGuards';
import { useAuthStore } from '@/stores/authStore';

const statuses: GuardStatusFilter[] = ['all', 'active', 'pending', 'blocked'];

export default function AdminGuardsScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<GuardStatusFilter>('all');
  const { data: guards = [], isLoading } = useAdminGuards(societyId, { search, status });

  const statusLabel = useMemo(
    () =>
      ({
        all: t('common.all'),
        active: t('status.active'),
        pending: t('status.pending'),
        blocked: t('status.blocked'),
      }) as Record<GuardStatusFilter, string>,
    [t],
  );

  if (isLoading) return <ScreenLoading variant="tab" />;

  return (
    <Screen safe={false} padded={false}>
      <View className="gap-md px-base pb-md pt-3">
        <Field value={search} onChangeText={setSearch} placeholder={t('admin.society.searchGuards')} />
        <View className="flex-row flex-wrap gap-sm">
          {statuses.map((item) => (
            <Chip key={item} label={statusLabel[item]} selected={status === item} onPress={() => setStatus(item)} />
          ))}
        </View>
        <Button
          label={t('admin.society.addGuard')}
          variant="tonal"
          icon="person_add"
          onPress={() => router.push('/(admin)/(society)/guards/new')}
        />
      </View>

      <FlashList
        data={guards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
        ItemSeparatorComponent={SmallGapSeparator}
        ListHeaderComponent={
          <Text variant="caption" color="textSecondary" className="pb-sm">
            {t('admin.society.guardCount', { count: guards.length })}
          </Text>
        }
        ListEmptyComponent={
          <EmptyState icon="verified_user" title={t('admin.society.noGuards')} subtitle={t('admin.society.noGuardsSub')} />
        }
        renderItem={({ item }) => (
          <GuardRow guard={item} onPress={() => router.push({ pathname: '/(admin)/(society)/guards/[id]', params: { id: item.id } })} />
        )}
      />
    </Screen>
  );
}
