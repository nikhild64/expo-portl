import { useQuery } from '@tanstack/react-query';
import { alertError } from '@/lib/alert';
import { router, useLocalSearchParams, useSegments } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Avatar, Button, Card, Screen, SkeletonCard, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { guardStackRoot } from '@/lib/guardRoutes';
import { useGuardNavigation } from '@/lib/useGuardNavigation';
import { VISITOR_PHOTOS_BUCKET } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useMarkEntered, useCancelVisitorRequest } from '@/queries/useVisitorLog';
import { useRealtimeTable } from '@/queries/useRealtimeTable';

function elapsedFrom(value: string | null | undefined, t: (key: string) => string) {
  if (!value) return t('guard.waiting.justNow');
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return t('guard.waiting.justNow');
  if (minutes === 1) return t('guard.waiting.oneMinuteWaiting');
  return `${minutes} minutes waiting`;
}

export function GuardWaitingForApprovalScreen() {
  const { t } = useTranslation();
  const guardNav = useGuardNavigation();
  const { visitorId } = useLocalSearchParams<{ visitorId: string }>();
  const segments = useSegments();
  const stackRoot = guardStackRoot(segments);

  const visitorQuery = useQuery({
    queryKey: ['visitors', 'detail', visitorId],
    enabled: !!visitorId,
    queryFn: async () => {
      const { data, error } = await supabase.from('visitors').select('*').eq('id', visitorId).single();
      if (error) throw error;
      return data;
    },
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 4000 : false),
  });

  useFocusEffect(
    useCallback(() => {
      if (!visitorId) return;
      void visitorQuery.refetch();
    }, [visitorId, visitorQuery.refetch]),
  );

  const appState = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const becameActive = appState.current.match(/inactive|background/) && nextState === 'active';
      appState.current = nextState;
      if (becameActive && visitorId) {
        void visitorQuery.refetch();
      }
    });

    return () => subscription.remove();
  }, [visitorId, visitorQuery.refetch]);

  useRealtimeTable({
    enabled: !!visitorId,
    event: 'UPDATE',
    filter: `id=eq.${visitorId}`,
    invalidateKeys: [['visitors', 'detail', visitorId]],
    table: 'visitors',
  });

  const markEntered = useMarkEntered(visitorId);

  const cancel = useCancelVisitorRequest();

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
    <Screen scroll variant="tab">
      <Card className="items-center gap-md">
        <Avatar name={visitor.visitor_name} storageBucket={VISITOR_PHOTOS_BUCKET} uri={visitor.visitor_photo_path} size="xl" />
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
          <Button
            label={t('guard.waiting.cancelRequest')}
            variant="outlined"
            loading={cancel.isPending}
            onPress={() =>
              cancel.mutate(visitorId, {
                onSuccess: () => router.replace(stackRoot),
                onError: (error) => alertError(t('alert.titles.couldNotCancelRequest'), error),
              })
            }
          />
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
                onError: (error) => alertError(t('alert.titles.couldNotMarkEntry'), error),
                onSuccess: () => guardNav.replace(),
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
