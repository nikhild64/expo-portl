import { Linking, View } from 'react-native';
import { alert } from '@/lib/alert';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Avatar, Button, Card, CountdownBar, Field, IconSymbol, Screen, Text } from '@/components';
import { formatFlatLabel, formatRelativeTime, maskPhone, titleize } from '@/lib/format';
import { VISITOR_PHOTOS_BUCKET } from '@/lib/storage';
import { useApproveVisitor, useRejectVisitor } from '@/queries/useVisitors';
import type { VisitorDetail } from '@/queries/useVisitors';

import { ApprovalSuccess } from './ApprovalSuccess';

interface Props {
  visitor: VisitorDetail;
}

const AUTO_REJECT_MS = 5 * 60 * 1000;

export function ApprovalSheet({ visitor }: Props) {
  const { t } = useTranslation();
  const [instructions, setInstructions] = useState(visitor.resident_instructions ?? t('resident.approval.instructionsPlaceholder'));
  const [justApproved, setJustApproved] = useState(false);
  const approve = useApproveVisitor();
  const reject = useRejectVisitor();
  const expiresAt = new Date(new Date(visitor.requested_at).getTime() + AUTO_REJECT_MS);
  const isApproved = visitor.status === 'approved';
  const flatLabel = formatFlatLabel(visitor.flats?.towers?.name, visitor.flats?.number);

  const handleApprove = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await approve.mutateAsync({ id: visitor.id, instructions });
      if (!isApproved) setJustApproved(true);
    } catch (error) {
      alert(
        t('alert.titles.approvalFailed'),
        error instanceof Error ? error.message : t('common.pleaseTryAgain'),
      );
    }
  };

  const handleReject = async () => {
    try {
      await reject.mutateAsync({ id: visitor.id });
      router.back();
    } catch (error) {
      alert(
        t('alert.titles.rejectFailed'),
        error instanceof Error ? error.message : t('common.pleaseTryAgain'),
      );
    }
  };

  if (justApproved) {
    return (
      <Screen safe={false} padded={false} className="bg-bg-elevated">
        <ApprovalSuccess
          visitorName={visitor.visitor_name}
          instructions={instructions}
          onInstructionsChange={setInstructions}
          onDone={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen safe={false} padded={false} className="gap-lg p-base">
      <Animated.View entering={FadeInDown.duration(250)} className="items-center gap-sm">
        <Text variant="caption" color="coral" className="tracking-widest">
          {t('resident.approval.atGate')}
        </Text>
        <Text variant="titleLarge">{titleize(visitor.type)}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(40).duration(250)} className="items-center gap-sm">
        <View>
          <Avatar name={visitor.visitor_name} storageBucket={VISITOR_PHOTOS_BUCKET} uri={visitor.visitor_photo_path ?? undefined} size="xl" />
          <View className="absolute bottom-0 right-0 flex-row items-center gap-xs rounded-pill border border-border bg-surface px-sm py-xs">
            <View className="h-2 w-2 rounded-pill bg-error" />
            <Text variant="caption" color="textSecondary">
              {t('common.live')}
            </Text>
          </View>
        </View>
        <Text variant="title">{visitor.visitor_name}</Text>
        <Text variant="body" color="textSecondary">
          {maskPhone(visitor.visitor_phone)}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(250)} className="gap-md">
        <Card variant="outlined" className="flex-row items-center gap-md">
          <IconSymbol name="apartment" color="textSecondary" />
          <View className="flex-1 gap-xs">
            <Text variant="caption" color="textSecondary">
              {t('resident.approval.forYourFlat')}
            </Text>
            <Text variant="body">{flatLabel}</Text>
          </View>
        </Card>

        {visitor.guard_note ? (
          <Card variant="outlined" className="flex-row items-center gap-md">
            <IconSymbol name="message" color="textSecondary" />
            <View className="flex-1 gap-xs">
              <Text variant="caption" color="textSecondary">
                {t('resident.approval.guardsNote')}
              </Text>
              <Text variant="body">{visitor.guard_note}</Text>
            </View>
          </Card>
        ) : null}
      </Animated.View>

      {!isApproved && (
        <Animated.View entering={FadeIn.duration(250)}>
          <CountdownBar expiresAt={expiresAt} />
        </Animated.View>
      )}

      {isApproved && (
        <Field
          label={t('resident.approval.residentInstructions')}
          value={instructions}
          onChangeText={setInstructions}
          placeholder={t('resident.approval.sheetPlaceholder')}
          multiline
        />
      )}

      <View className="mt-auto gap-sm">
        {visitor.visitor_phone && (
          <Button
            label={t('resident.approval.callVisitorFirst')}
            variant="text"
            icon="phone"
            onPress={() => Linking.openURL(`tel:${visitor.visitor_phone}`)}
          />
        )}
        {!isApproved ? (
          <View className="gap-sm">
            <Button label={t('resident.approval.approveEntry')} icon="check_circle" full loading={approve.isPending} onPress={handleApprove} />
            <Button label={t('common.reject')} variant="outlined" full loading={reject.isPending} onPress={handleReject} />
          </View>
        ) : (
          <Button label={t('resident.approval.saveInstructions')} loading={approve.isPending} onPress={handleApprove} />
        )}
        <Text variant="caption" color="textTertiary" className="text-center">
          {t('resident.approval.requested', { time: formatRelativeTime(visitor.requested_at) })}
        </Text>
      </View>
    </Screen>
  );
}
