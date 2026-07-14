import { File, Paths } from 'expo-file-system';
import { alertWarning } from '@/lib/alert';
import * as Sharing from 'expo-sharing';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

import { Button, Card, Chip, Field, Screen, ScreenLoading, StatusPill, Text } from '@/components';
import { visitorStatusLabel, visitorStatusTone } from '@/features/visitors/visitorStatus';
import { toCsv } from '@/lib/csv';
import { formatDateTime, titleize } from '@/lib/format';
import { useAdminVisitorHistory } from '@/queries/useAdminVisitors';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

type StatusFilter = Tables<'visitors'>['status'] | 'all';
const statuses: StatusFilter[] = ['all', 'pending', 'entered', 'exited', 'rejected'];

export default function AdminVisitorHistoryScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const { data: visitors = [], isLoading } = useAdminVisitorHistory(societyId, { search, status });

  const statusLabel = useCallback(
    (item: StatusFilter) => (item === 'all' ? t('common.all') : t(`status.${item}`)),
    [t],
  );

  const exportCsv = useCallback(async () => {
    const csv = toCsv(
      visitors.map((visitor) => ({
        entered_at: visitor.entered_at,
        exited_at: visitor.exited_at,
        purpose: visitor.purpose,
        requested_at: visitor.requested_at,
        status: visitor.status,
        type: visitor.type,
        visitor_name: visitor.visitor_name,
        visitor_phone: visitor.visitor_phone,
      })),
    );
    const file = new File(Paths.cache, `portl-visitors-${Date.now()}.csv`);
    if (file.exists) file.delete();
    file.create();
    file.write(csv);
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      alertWarning(t('alert.titles.sharingUnavailable'), file.uri);
      return;
    }
    await Sharing.shareAsync(file.uri, { dialogTitle: t('nav.screens.visitorHistory'), mimeType: 'text/csv' });
  }, [t, visitors]);

  const listHeader = useMemo(
    () => (
      <View className="gap-md pb-md">
        <Field value={search} onChangeText={setSearch} placeholder={t('admin.ops.searchVisitor')} />
        <View className="flex-row flex-wrap gap-sm">
          {statuses.map((item) => (
            <Chip key={item} label={statusLabel(item)} selected={status === item} onPress={() => setStatus(item)} />
          ))}
        </View>
        <Button label={t('admin.ops.exportCsv')} icon="share" onPress={exportCsv} />
      </View>
    ),
    [exportCsv, search, status, statusLabel, t],
  );

  const renderItem = useCallback(
    ({ item: visitor }: { item: (typeof visitors)[number] }) => (
      <Card variant="outlined" className="mb-md gap-sm">
        <View className="flex-row items-start justify-between gap-md">
          <View className="flex-1">
            <Text variant="headline">{visitor.visitor_name}</Text>
            <Text variant="footnote" color="textSecondary">
              {titleize(visitor.type)} - {formatDateTime(visitor.requested_at)}
            </Text>
          </View>
          <StatusPill tone={visitorStatusTone(visitor.status)} label={visitorStatusLabel(visitor.status)} />
        </View>
        <Text variant="body" color="textSecondary">
          {visitor.purpose ?? t('admin.ops.noPurpose')}
        </Text>
      </Card>
    ),
    [t],
  );

  if (isLoading) return <ScreenLoading variant="tab" />;

  return (
    <Screen safe={false} padded={false} className="px-base pt-sm">
      <FlashList
        data={visitors}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{ paddingBottom: 96 }}
      />
    </Screen>
  );
}
