import { File, Paths } from 'expo-file-system';
import { alert } from '@/lib/alert';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card, Chip, Field, Screen, ScreenLoading, StatusPill, Text } from '@/components';
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

  if (isLoading) return <ScreenLoading safe={false} />;

  const statusLabel = (item: StatusFilter) => (item === 'all' ? t('common.all') : t(`status.${item}`));

  const exportCsv = async () => {
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
      alert(t('alert.titles.sharingUnavailable'), file.uri);
      return;
    }
    await Sharing.shareAsync(file.uri, { dialogTitle: t('nav.screens.visitorHistory'), mimeType: 'text/csv' });
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Field value={search} onChangeText={setSearch} placeholder={t('admin.ops.searchVisitor')} />
      <View className="flex-row flex-wrap gap-sm">
        {statuses.map((item) => (
          <Chip key={item} label={statusLabel(item)} selected={status === item} onPress={() => setStatus(item)} />
        ))}
      </View>
      <Button label={t('admin.ops.exportCsv')} icon="share" onPress={exportCsv} />
      {visitors.map((visitor) => (
        <Card key={visitor.id} variant="outlined" className="gap-sm">
          <View className="flex-row items-start justify-between gap-md">
            <View className="flex-1">
              <Text variant="headline">{visitor.visitor_name}</Text>
              <Text variant="footnote" color="textSecondary">
                {titleize(visitor.type)} - {formatDateTime(visitor.requested_at)}
              </Text>
            </View>
            <StatusPill tone={visitor.status === 'rejected' ? 'danger' : visitor.status === 'entered' ? 'info' : visitor.status === 'exited' ? 'neutral' : 'warning'} label={t(`status.${visitor.status}`)} />
          </View>
          <Text variant="body" color="textSecondary">
            {visitor.purpose ?? t('admin.ops.noPurpose')}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
