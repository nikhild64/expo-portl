import { Alert, Linking, View } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

import { Avatar, Button, Card, Field, StatusPill, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { useApproveVisitor, useRejectVisitor } from '@/queries/useVisitors';
import type { Tables } from '@/types/database';

import { ApprovalSuccess } from './ApprovalSuccess';

interface Props {
  visitor: Tables<'visitors'>;
}

export function ApprovalSheet({ visitor }: Props) {
  const [instructions, setInstructions] = useState(visitor.resident_instructions ?? '');
  const [justApproved, setJustApproved] = useState(false);
  const approve = useApproveVisitor();
  const reject = useRejectVisitor();
  const expiresAt = new Date(new Date(visitor.requested_at).getTime() + 5 * 60 * 1000);
  const isApproved = visitor.status === 'approved';

  useEffect(() => {
    if (!justApproved) return undefined;
    const timeout = setTimeout(() => router.back(), 1200);
    return () => clearTimeout(timeout);
  }, [justApproved]);

  const handleApprove = async () => {
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
    return <ApprovalSuccess />;
  }

  return (
    <View className="flex-1 gap-lg p-base bg-bg">
      <View className="items-center gap-sm">
        <Avatar name={visitor.visitor_name} uri={visitor.visitor_photo_url ?? undefined} size="xl" />
        <Text variant="title">{visitor.visitor_name}</Text>
        <StatusPill tone={isApproved ? 'success' : 'warning'} label={titleize(visitor.status)} />
      </View>

      <Card className="gap-sm">
        <Text variant="caption" color="textSecondary">
          FOR YOUR FLAT
        </Text>
        <Text variant="body">{titleize(visitor.type)}</Text>
        <Text variant="footnote" color="textSecondary">
          {visitor.purpose ?? 'No purpose shared'}
        </Text>
        <Text variant="caption" color="textTertiary">
          Requested {formatDateTime(visitor.requested_at)} - Auto-reject after {formatDateTime(expiresAt.toISOString())}
        </Text>
      </Card>

      {visitor.guard_note && (
        <Card variant="outlined">
          <Text variant="footnote" color="textSecondary">
            Guard note
          </Text>
          <Text variant="body">{visitor.guard_note}</Text>
        </Card>
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
            label={`Call ${visitor.visitor_phone}`}
            variant="outlined"
            icon="phone"
            onPress={() => Linking.openURL(`tel:${visitor.visitor_phone}`)}
          />
        )}
        {!isApproved ? (
          <View className="flex-row gap-sm">
            <Button label="Reject" variant="danger" full loading={reject.isPending} onPress={handleReject} />
            <Button label="Approve" full loading={approve.isPending} onPress={handleApprove} />
          </View>
        ) : (
          <Button label="Save instructions" loading={approve.isPending} onPress={handleApprove} />
        )}
      </View>
    </View>
  );
}
