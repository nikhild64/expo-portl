import { useEffect } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Avatar, Button, Card, Screen, SkeletonCard, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type Visitor = Tables<'visitors'>;

function elapsedFrom(value?: string | null) {
  if (!value) return 'Just now';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 minute waiting';
  return `${minutes} minutes waiting`;
}

export default function WaitingForApprovalScreen() {
  const { visitorId } = useLocalSearchParams<{ visitorId: string }>();
  const queryClient = useQueryClient();

  const visitorQuery = useQuery({
    queryKey: ['visitors', 'detail', visitorId],
    enabled: !!visitorId,
    queryFn: async () => {
      const { data, error } = await supabase.from('visitors').select('*').eq('id', visitorId).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!visitorId) return undefined;

    const channel = supabase
      .channel(`visitor-${visitorId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'visitors', filter: `id=eq.${visitorId}` },
        (payload) => {
          queryClient.setQueryData(['visitors', 'detail', visitorId], payload.new as Visitor);
          queryClient.invalidateQueries({ queryKey: ['guard-stats'] });
          queryClient.invalidateQueries({ queryKey: ['guard-activity'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, visitorId]);

  const markEntered = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('visitors')
        .update({ entered_at: new Date().toISOString(), status: 'entered' })
        .eq('id', visitorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['guard-activity'] });
      router.replace('/(guard)/(home)/index' as never);
    },
    onError: (error) => {
      Alert.alert('Could not mark entry', error instanceof Error ? error.message : 'Please try again.');
    },
  });

  const cancel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('visitors').update({ status: 'expired' }).eq('id', visitorId);
      if (error) throw error;
    },
    onSuccess: () => router.replace('/(guard)/(add)' as never),
  });

  const visitor = visitorQuery.data;

  if (visitorQuery.isLoading || !visitor) {
    return (
      <Screen safe={false} contentContainerStyle={{ paddingTop: 12 }}>
        <SkeletonCard />
      </Screen>
    );
  }

  const approved = visitor.status === 'approved' || visitor.status === 'entered';
  const rejected = visitor.status === 'rejected';

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="items-center gap-md">
        <Avatar name={visitor.visitor_name} uri={visitor.visitor_photo_url ?? undefined} size="xl" />
        <View className="items-center gap-xs">
          <Text variant="titleLarge">{visitor.visitor_name}</Text>
          <Text variant="body" color="textSecondary">
            {titleize(visitor.type)} · Requested {formatDateTime(visitor.requested_at)}
          </Text>
        </View>

        {approved ? (
          <StatusPill tone="success" label="APPROVED" icon="check_circle" />
        ) : rejected ? (
          <StatusPill tone="danger" label="REJECTED" icon="cancel" />
        ) : (
          <StatusPill tone="warning" label="WAITING" icon="schedule" />
        )}
      </Card>

      {!approved && !rejected && (
        <Card className="gap-md">
          <Text variant="headline">Waiting for resident approval</Text>
          <Text variant="body" color="textSecondary">
            {elapsedFrom(visitor.requested_at)}. This screen will update automatically when the resident responds.
          </Text>
          <Button label="Cancel request" variant="outlined" loading={cancel.isPending} onPress={() => cancel.mutate()} />
        </Card>
      )}

      {approved && (
        <Card accent="success" className="gap-md">
          <Text variant="headline">Resident approved this visitor</Text>
          {!!visitor.resident_instructions && (
            <Text variant="body" color="textSecondary">
              Instructions: {visitor.resident_instructions}
            </Text>
          )}
          <Button label={visitor.entered_at ? 'Entry marked' : 'Mark entered'} loading={markEntered.isPending} disabled={!!visitor.entered_at} onPress={() => markEntered.mutate()} />
        </Card>
      )}

      {rejected && (
        <Card accent="danger" className="gap-md">
          <Text variant="headline">Resident rejected this visitor</Text>
          <Text variant="body" color="textSecondary">
            Politely ask the visitor to contact the resident before trying again.
          </Text>
          <Button label="Add another visitor" onPress={() => router.replace('/(guard)/(add)' as never)} />
        </Card>
      )}
    </Screen>
  );
}
