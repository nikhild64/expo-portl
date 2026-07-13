import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alert } from '@/lib/alert';
import { router, useLocalSearchParams, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Button, Card, Screen, SkeletonCard, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { VISITOR_PHOTOS_BUCKET } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useMarkEntered } from '@/queries/useVisitorLog';
import type { Tables } from '@/types/database';

type Visitor = Tables<'visitors'>;

function elapsedFrom(value: string | null | undefined, t: (key: string) => string) {
  if (!value) return t('guard.waiting.justNow');
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return t('guard.waiting.justNow');
  if (minutes === 1) return t('guard.waiting.oneMinuteWaiting');
  return `${minutes} minutes waiting`;
}

export function GuardWaitingForApprovalScreen() {
  const { t } = useTranslation();
  const { visitorId } = useLocalSearchParams<{ visitorId: string }>();
  const segments = useSegments();
  const queryClient = useQueryClient();
  const isHomeStack = (segments as readonly string[]).includes('(home)');
  const stackRoot = isHomeStack ? '/(guard)/(home)' : '/(guard)/(add)';

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

  const markEntered = useMarkEntered(visitorId);

  const cancel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('visitors').update({ status: 'expired' }).eq('id', visitorId);
      if (error) throw error;
    },
    onSuccess: () => router.replace(stackRoot),
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
        <Avatar name={visitor.visitor_name} storageBucket={VISITOR_PHOTOS_BUCKET} uri={visitor.visitor_photo_path ?? undefined} size="xl" />
        <View className="items-center gap-xs">
          <Text variant="titleLarge">{visitor.visitor_name}</Text>
          <Text variant="body" color="textSecondary">
            {titleize(visitor.type)} · Requested {formatDateTime(visitor.requested_at)}
          </Text>
        </View>

        {approved ? (
          <StatusPill tone="success" label={t('guard.waiting.approved')} icon="check_circle" />
        ) : rejected ? (
          <StatusPill tone="danger" label={t('guard.waiting.rejected')} icon="cancel" />
        ) : (
          <StatusPill tone="warning" label={t('guard.waiting.waiting')} icon="schedule" />
        )}
      </Card>

      {!approved && !rejected && (
        <Card className="gap-md">
          <Text variant="headline">{t('guard.waiting.waitingApproval')}</Text>
          <Text variant="body" color="textSecondary">
            {elapsedFrom(visitor.requested_at, t)}. This screen will update automatically when the resident responds.
          </Text>
          <Button label={t('guard.waiting.cancelRequest')} variant="outlined" loading={cancel.isPending} onPress={() => cancel.mutate()} />
        </Card>
      )}

      {approved && (
        <Card className="gap-md">
          <Text variant="headline">{t('guard.waiting.residentApproved')}</Text>
          {!!visitor.resident_instructions && (
            <Text variant="body" color="textSecondary">
              Instructions: {visitor.resident_instructions}
            </Text>
          )}
          <Button
            label={visitor.entered_at ? t('guard.waiting.entryMarked') : t('guard.waiting.markEntered')}
            loading={markEntered.isPending}
            disabled={!!visitor.entered_at}
            onPress={() =>
              markEntered.mutate(undefined, {
                onError: (error) => {
                  alert(
                    t('alert.titles.couldNotMarkEntry'),
                    error instanceof Error ? error.message : t('common.pleaseTryAgain'),
                  );
                },
                onSuccess: () => router.replace('/(guard)/(home)'),
              })
            }
          />
        </Card>
      )}

      {rejected && (
        <Card className="gap-md">
          <Text variant="headline">{t('guard.waiting.residentRejected')}</Text>
          <Text variant="body" color="textSecondary">
            {t('guard.waiting.politelyAsk')}
          </Text>
          <Button label={t('guard.waiting.addAnotherVisitor')} onPress={() => router.replace(stackRoot)} />
        </Card>
      )}
    </Screen>
  );
}
