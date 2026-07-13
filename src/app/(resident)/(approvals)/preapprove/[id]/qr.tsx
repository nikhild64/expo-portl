import { Alert, Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import { Button, Card, ScreenEmpty, Screen, ScreenLoading, Text } from '@/components';
import { canRevokePreApproval, confirmRevokePreApproval } from '@/features/visitors/revokePreApproval';
import { formatDateTime } from '@/lib/format';
import { usePreApproval, useRevokePreApproval } from '@/queries/useVisitors';
import { useAuthStore } from '@/stores/authStore';

export default function PreApprovalQrScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.session?.user.id);
  const revokePreApproval = useRevokePreApproval();
  const { data: preApproval, isLoading, error } = usePreApproval(id);

  if (isLoading) return <ScreenLoading safe={false} />;

  if (error || !preApproval) {
    return <ScreenEmpty safe={false} icon="error_outline" title="QR not found" subtitle="This pre-approval may have expired or been removed." />;
  }

  const qrValue = `portl-nd://gate?code=${preApproval.code}`;
  const shareText = `Visitor QR for ${preApproval.visitor_name}: ${qrValue}`;
  const canRevoke = canRevokePreApproval(preApproval, userId, profile?.role);

  const open = (url: string) => Linking.openURL(url).catch(() => Alert.alert('Could not open app', shareText));

  const revoke = () =>
    confirmRevokePreApproval(preApproval, (preApprovalId) =>
      revokePreApproval.mutate(preApprovalId, {
        onSuccess: () => {
          if (router.canGoBack()) router.back();
        },
      }),
    );

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Card className="items-center gap-lg">
        <View className="rounded-lg bg-surface p-lg">
          <QRCode value={qrValue} size={240} backgroundColor="#FFFFFF" color="#1A1412" />
        </View>
        <View className="items-center gap-xs">
          <Text variant="title">{preApproval.visitor_name}</Text>
          <Text variant="body" color="textSecondary">
            {preApproval.code}
          </Text>
          <Text variant="footnote" color="textTertiary">
            Valid {formatDateTime(preApproval.start_at)} to {formatDateTime(preApproval.end_at)}
          </Text>
        </View>
      </Card>

      <View className="gap-sm">
        <Button label="Share on WhatsApp" icon="share" onPress={() => open(`whatsapp://send?text=${encodeURIComponent(shareText)}`)} />
        <Button label="Send SMS" variant="outlined" icon="message" onPress={() => open(`sms:?body=${encodeURIComponent(shareText)}`)} />
        <Button label="Show link" variant="tonal" icon="qr_code" onPress={() => Alert.alert('Visitor link', qrValue)} />
        {canRevoke && (
          <Button
            label="Revoke pre-approval"
            variant="danger"
            icon="cancel"
            loading={revokePreApproval.isPending}
            onPress={revoke}
          />
        )}
      </View>

      <Text variant="footnote" color="textSecondary" className="text-center">
        QR is single-use per person. It self-destructs after the visit window.
      </Text>
    </Screen>
  );
}
