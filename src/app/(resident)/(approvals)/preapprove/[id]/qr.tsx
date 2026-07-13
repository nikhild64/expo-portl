import { Alert, Linking, Pressable, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, IconSymbol, ScreenEmpty, Screen, ScreenLoading, Text } from '@/components';
import { canRevokePreApproval, confirmRevokePreApproval } from '@/features/visitors/revokePreApproval';
import { formatDateShort, formatTimeRange, titleize } from '@/lib/format';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { usePreApproval, useRevokePreApproval } from '@/queries/useVisitors';
import { useAuthStore } from '@/stores/authStore';

export default function PreApprovalQrScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: primaryFlat } = useMyPrimaryFlat();
  const revokePreApproval = useRevokePreApproval();
  const { data: preApproval, isLoading, error } = usePreApproval(id);

  if (isLoading) return <ScreenLoading safe={false} />;

  if (error || !preApproval) {
    return <ScreenEmpty safe={false} icon="error_outline" title="QR not found" subtitle="This pre-approval may have expired or been removed." />;
  }

  const qrValue = `portl-nd://gate?code=${preApproval.code}`;
  const shareText = `Visitor QR for ${preApproval.visitor_name}: ${qrValue}`;
  const canRevoke = canRevokePreApproval(preApproval, userId, profile?.role);
  const flatNumber = primaryFlat?.flats?.number;
  const towerName = primaryFlat?.flats?.towers?.name;
  const residentLabel = profile?.full_name?.split(' ')[0] ?? 'Resident';

  const open = (url: string) => Linking.openURL(url).catch(() => Alert.alert('Could not open app', shareText));

  const copyCode = async () => {
    await Clipboard.setStringAsync(preApproval.code);
    Alert.alert('Copied', `${preApproval.code} copied to clipboard.`);
  };

  const revoke = () =>
    confirmRevokePreApproval(preApproval, (preApprovalId) =>
      revokePreApproval.mutate(preApprovalId, {
        onSuccess: () => {
          if (router.canGoBack()) router.back();
        },
      }),
    );

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }} className="bg-bg-elevated">
      <Animated.View entering={FadeInDown.duration(280)} className="items-center gap-sm">
        <View className="h-14 w-14 items-center justify-center rounded-pill bg-sage-light">
          <IconSymbol name="check_circle" size={36} color="success" />
        </View>
        <Text variant="titleLarge">{preApproval.visitor_name.split(' ')[0]} can enter</Text>
        <Text variant="body" color="textSecondary">
          Valid {formatDateShort(preApproval.start_at)}, {formatTimeRange(preApproval.start_at, preApproval.end_at)}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(280)}>
        <Card className="items-center gap-lg">
          <View className="rounded-lg border-2 border-success bg-surface p-lg">
            <QRCode value={qrValue} size={220} backgroundColor="#FFFFFF" color="#1A1412" />
          </View>
          <Pressable className="flex-row items-center gap-sm" onPress={copyCode}>
            <Text variant="headline">{preApproval.code}</Text>
            <IconSymbol name="content_copy" size={18} color="coral" />
          </Pressable>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(280)}>
        <Card variant="outlined" className="flex-row items-center gap-md">
          <View className="rounded-md bg-surface-secondary p-sm">
            <IconSymbol name="qr_code" color="coral" />
          </View>
          <View className="flex-1 gap-xs">
            <Text variant="caption" color="textSecondary">
              Preview at gate
            </Text>
            <Text variant="subhead">{preApproval.visitor_name}</Text>
            <Text variant="footnote" color="textSecondary">
              {titleize(preApproval.type)} of {residentLabel}
              {flatNumber ? ` (${towerName ? `${towerName}-` : ''}${flatNumber})` : ''}
            </Text>
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(280)} className="flex-row justify-center gap-lg">
        <Pressable className="items-center gap-xs" onPress={() => open(`whatsapp://send?text=${encodeURIComponent(shareText)}`)}>
          <View className="h-12 w-12 items-center justify-center rounded-pill bg-surface-secondary">
            <IconSymbol name="share" color="coral" />
          </View>
          <Text variant="caption" color="textSecondary">
            WhatsApp
          </Text>
        </Pressable>
        <Pressable className="items-center gap-xs" onPress={() => open(`sms:?body=${encodeURIComponent(shareText)}`)}>
          <View className="h-12 w-12 items-center justify-center rounded-pill bg-surface-secondary">
            <IconSymbol name="message" color="coral" />
          </View>
          <Text variant="caption" color="textSecondary">
            SMS
          </Text>
        </Pressable>
        <Pressable className="items-center gap-xs" onPress={copyCode}>
          <View className="h-12 w-12 items-center justify-center rounded-pill bg-surface-secondary">
            <IconSymbol name="content_copy" color="coral" />
          </View>
          <Text variant="caption" color="textSecondary">
            Copy
          </Text>
        </Pressable>
      </Animated.View>

      <View className="gap-sm">
        <Button label="Save to frequent visitors" variant="outlined" icon="person_add" />
        <Button
          label="View all my pre-approvals"
          variant="text"
          onPress={() => router.push('/(resident)/(approvals)')}
        />
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
