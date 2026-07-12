import { Alert, View } from 'react-native';
import { useState } from 'react';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { Button, Card, Chip, Field, Screen, SkeletonCard, StatusPill, Text } from '@/components';
import { toCsv } from '@/lib/csv';
import { formatDateTime, titleize } from '@/lib/format';
import { useAdminVisitorHistory } from '@/queries/useAdminVisitors';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

type StatusFilter = Tables<'visitors'>['status'] | 'all';
const statuses: StatusFilter[] = ['all', 'pending', 'entered', 'exited', 'rejected'];

export default function AdminVisitorHistoryScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const { data: visitors = [], isLoading } = useAdminVisitorHistory(societyId, { search, status });

  if (isLoading) return <SkeletonCard />;

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
      Alert.alert('Sharing unavailable', file.uri);
      return;
    }
    await Sharing.shareAsync(file.uri, { dialogTitle: 'Export visitor history', mimeType: 'text/csv' });
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Field value={search} onChangeText={setSearch} placeholder="Search visitor name" />
      <View className="flex-row flex-wrap gap-sm">
        {statuses.map((item) => (
          <Chip key={item} label={item} selected={status === item} onPress={() => setStatus(item)} />
        ))}
      </View>
      <Button label="Export CSV" icon="share" onPress={exportCsv} />
      {visitors.map((visitor) => (
        <Card key={visitor.id} variant="outlined" className="gap-sm">
          <View className="flex-row items-start justify-between gap-md">
            <View className="flex-1">
              <Text variant="headline">{visitor.visitor_name}</Text>
              <Text variant="footnote" color="textSecondary">
                {titleize(visitor.type)} - {formatDateTime(visitor.requested_at)}
              </Text>
            </View>
            <StatusPill tone={visitor.status === 'rejected' ? 'danger' : visitor.status === 'entered' ? 'info' : visitor.status === 'exited' ? 'neutral' : 'warning'} label={titleize(visitor.status)} />
          </View>
          <Text variant="body" color="textSecondary">
            {visitor.purpose ?? 'No purpose'}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
