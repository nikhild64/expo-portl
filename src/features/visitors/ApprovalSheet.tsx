import { Alert, Linking, View } from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
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
  const [instructions, setInstructions] = useState(visitor.resident_instructions ?? 'Ring the bell twice');
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
      Alert.alert('Approval failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleReject = async () => {
    try {
      await reject.mutateAsync({ id: visitor.id });
      router.back();
    } catch (error) {
      Alert.alert('Reject failed', error instanceof Error ? error.message : 'Please try again.');
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
          AT THE GATE
        </Text>
        <Text variant="titleLarge">{titleize(visitor.type)}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(40).duration(250)} className="items-center gap-sm">
        <View>
          <Avatar name={visitor.visitor_name} storageBucket={VISITOR_PHOTOS_BUCKET} uri={visitor.visitor_photo_path ?? undefined} size="xl" />
          <View className="absolute bottom-0 right-0 flex-row items-center gap-xs rounded-pill border border-border bg-surface px-sm py-xs">
            <View className="h-2 w-2 rounded-pill bg-error" />
            <Text variant="caption" color="textSecondary">
              Live
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
              For your flat
            </Text>
            <Text variant="body">{flatLabel}</Text>
          </View>
        </Card>

        {visitor.guard_note ? (
          <Card variant="outlined" className="flex-row items-center gap-md">
            <IconSymbol name="message" color="textSecondary" />
            <View className="flex-1 gap-xs">
              <Text variant="caption" color="textSecondary">
                Guard&apos;s note
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
          label="Resident instructions"
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Example: Leave parcel with security"
          multiline
        />
      )}

      <View className="mt-auto gap-sm">
        {visitor.visitor_phone && (
          <Button
            label="Call visitor first"
            variant="text"
            icon="phone"
            onPress={() => Linking.openURL(`tel:${visitor.visitor_phone}`)}
          />
        )}
        {!isApproved ? (
          <View className="gap-sm">
            <Button label="Approve entry" icon="check_circle" full loading={approve.isPending} onPress={handleApprove} />
            <Button label="Reject" variant="outlined" full loading={reject.isPending} onPress={handleReject} />
          </View>
        ) : (
          <Button label="Save instructions" loading={approve.isPending} onPress={handleApprove} />
        )}
        <Text variant="caption" color="textTertiary" className="text-center">
          Requested {formatRelativeTime(visitor.requested_at)}
        </Text>
      </View>
    </Screen>
  );
}
