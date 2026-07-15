import { useQuery } from '@tanstack/react-query';
import { alertError } from '@/lib/alert';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Button, Card, Screen, SkeletonCard, StatusPill, Text } from '@/components';
import { formatDateTime, formatFlatLabel, titleize } from '@/lib/format';
import { useGuardNavigation } from '@/lib/useGuardNavigation';
import { VISITOR_PHOTOS_BUCKET } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useMarkEntered } from '@/queries/useVisitorLog';

type VerifyVisitor = {
  entered_at: string | null;
  flat_id: string;
  id: string;
  purpose: string | null;
  resident_instructions: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'entered' | 'exited';
  type: 'guest' | 'delivery' | 'cab' | 'service';
  visitor_name: string;
  visitor_phone: string | null;
  visitor_photo_path: string | null;
  flats: { number: string; towers: { name: string } | null } | null;
};

export function GuardVerifyEntryScreen() {
  const { t } = useTranslation();
  const guardNav = useGuardNavigation();
  const { visitorId } = useLocalSearchParams<{ visitorId: string }>();

  const visitorQuery = useQuery({
    queryKey: ['visitors', 'verify', visitorId],
    enabled: !!visitorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visitors')
        .select('id, flat_id, visitor_name, visitor_phone, visitor_photo_path, type, purpose, status, entered_at, resident_instructions, flats(number, towers(name))')
        .eq('id', visitorId)
        .single();

      if (error) throw error;
      return data as VerifyVisitor;
    },
  });

  const markEntered = useMarkEntered(visitorId);

  const visitor = visitorQuery.data;

  if (visitorQuery.isLoading || !visitor) {
    return (
      <Screen safe={false} contentContainerStyle={{ paddingTop: 12 }}>
        <SkeletonCard />
      </Screen>
    );
  }

  const flatLabel = formatFlatLabel(visitor.flats?.towers?.name, visitor.flats?.number);

  return (
    <Screen scroll variant="tab">
      <Card className="items-center gap-md">
        <Avatar name={visitor.visitor_name} storageBucket={VISITOR_PHOTOS_BUCKET} uri={visitor.visitor_photo_path} size="xl" />
        <View className="items-center gap-xs">
          <Text variant="titleLarge">{visitor.visitor_name}</Text>
          {!!visitor.visitor_phone && (
            <Text variant="body" color="textSecondary" selectable>
              {visitor.visitor_phone}
            </Text>
          )}
        </View>
        <StatusPill
          tone={visitor.entered_at ? 'success' : 'info'}
          label={visitor.entered_at ? t('guard.verify.entered') : t('guard.verify.approved')}
        />
      </Card>

      <Card className="gap-md">
        <View>
          <Text variant="caption" color="textSecondary">
            FLAT
          </Text>
          <Text variant="headline">{flatLabel}</Text>
        </View>
        <View>
          <Text variant="caption" color="textSecondary">
            TYPE
          </Text>
          <Text variant="headline">{titleize(visitor.type)}</Text>
        </View>
        {!!visitor.purpose && (
          <View>
            <Text variant="caption" color="textSecondary">
              PURPOSE
            </Text>
            <Text variant="headline">{visitor.purpose}</Text>
          </View>
        )}
        {!!visitor.resident_instructions && (
          <View>
            <Text variant="caption" color="textSecondary">
              {t('guard.verify.residentInstructions')}
            </Text>
            <Text variant="body">{visitor.resident_instructions}</Text>
          </View>
        )}
        {!!visitor.entered_at && (
          <Text variant="footnote" color="success">
            {t('status.entered')} {formatDateTime(visitor.entered_at)}
          </Text>
        )}
      </Card>

      <Button
        label={visitor.entered_at ? t('guard.verify.entryAlreadyMarked') : t('guard.waiting.markEntered')}
        loading={markEntered.isPending}
        disabled={!!visitor.entered_at}
        full
        onPress={() =>
          markEntered.mutate(undefined, {
            onError: (error) => {
              alertError(t('alert.titles.couldNotMarkEntry'), error);
            },
            onSuccess: () => guardNav.replace(),
          })
        }
      />
    </Screen>
  );
}
