import { Linking, Pressable, View } from 'react-native';
import { alert, alertSuccess } from '@/lib/alert';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, IconSymbol, ScreenEmpty, Screen, ScreenLoading, Text } from '@/components';
import { PreApprovalQrCode, formatPreApprovalQrValue } from '@/features/visitors/PreApprovalQrCode';
import { canRevokePreApproval, confirmRevokePreApproval } from '@/features/visitors/revokePreApproval';
import { formatDateShort, formatFirstName, formatFlatLabel, formatTimeRange, titleize } from '@/lib/format';
import { useMyPrimaryFlat } from '@/queries/useMe';
import { useSaveFrequentVisitor } from '@/queries/useFrequentVisitors';
import { usePreApproval, useRevokePreApproval } from '@/queries/useVisitors';
import { useAuthStore } from '@/stores/authStore';

export default function PreApprovalQrScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: primaryFlat } = useMyPrimaryFlat();
  const revokePreApproval = useRevokePreApproval();
  const saveFrequentVisitor = useSaveFrequentVisitor();
  const { data: preApproval, isLoading, error } = usePreApproval(id);

  if (isLoading) return <ScreenLoading variant="tab" />;

  if (error || !preApproval) {
    return (
      <ScreenEmpty
        safe={false}
        icon="error_outline"
        title={t('resident.preapprove.qrNotFound')}
        subtitle={t('resident.preapprove.qrNotFoundSub')}
      />
    );
  }

  const qrValue = formatPreApprovalQrValue(preApproval.code);
  const shareText = t('resident.preapprove.shareText', { name: preApproval.visitor_name, code: qrValue });
  const shareSubject = t('resident.preapprove.shareSubject', { name: preApproval.visitor_name });
  const canRevoke = canRevokePreApproval(preApproval, userId, profile?.role);
  const flatLabel = formatFlatLabel(primaryFlat?.flats?.towers?.name, primaryFlat?.flats?.number, '');
  const residentLabel = formatFirstName(profile?.full_name, t('nav.screens.resident'));
  const visitorFirstName = preApproval.visitor_name.split(' ')[0];

  const open = (url: string) =>
    Linking.openURL(url).catch(() => alert(t('alert.titles.couldNotOpenApp'), shareText));

  const copyCode = async () => {
    await Clipboard.setStringAsync(preApproval.code);
    alertSuccess(t('alert.titles.copied'), t('alert.messages.codeCopied', { code: preApproval.code }));
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
        <Text variant="titleLarge">{t('resident.preapprove.canEnter', { name: visitorFirstName })}</Text>
        <Text variant="body" color="textSecondary">
          {t('resident.preapprove.validWindow', {
            date: formatDateShort(preApproval.start_at),
            timeRange: formatTimeRange(preApproval.start_at, preApproval.end_at),
          })}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(280)}>
        <Card className="items-center gap-md">
          <PreApprovalQrCode code={preApproval.code} />
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
              {t('resident.preapprove.previewAtGate')}
            </Text>
            <Text variant="subhead">{preApproval.visitor_name}</Text>
            <Text variant="footnote" color="textSecondary">
              {t('resident.preapprove.typeOfResident', { type: titleize(preApproval.type), resident: residentLabel })}
              {flatLabel ? ` (${flatLabel})` : ''}
            </Text>
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(280)} className="flex-row flex-wrap justify-center gap-lg">
        <Pressable className="items-center gap-xs" onPress={() => open(`whatsapp://send?text=${encodeURIComponent(shareText)}`)}>
          <View className="h-12 w-12 items-center justify-center rounded-pill bg-surface-secondary">
            <IconSymbol name="share" color="coral" />
          </View>
          <Text variant="caption" color="textSecondary">
            {t('resident.preapprove.whatsapp')}
          </Text>
        </Pressable>
        <Pressable className="items-center gap-xs" onPress={() => open(`sms:?body=${encodeURIComponent(shareText)}`)}>
          <View className="h-12 w-12 items-center justify-center rounded-pill bg-surface-secondary">
            <IconSymbol name="message" color="coral" />
          </View>
          <Text variant="caption" color="textSecondary">
            {t('resident.preapprove.sms')}
          </Text>
        </Pressable>
        <Pressable
          className="items-center gap-xs"
          onPress={() =>
            open(`mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareText)}`)
          }
        >
          <View className="h-12 w-12 items-center justify-center rounded-pill bg-surface-secondary">
            <IconSymbol name="email" color="coral" />
          </View>
          <Text variant="caption" color="textSecondary">
            {t('common.email')}
          </Text>
        </Pressable>
        <Pressable className="items-center gap-xs" onPress={copyCode}>
          <View className="h-12 w-12 items-center justify-center rounded-pill bg-surface-secondary">
            <IconSymbol name="content_copy" color="coral" />
          </View>
          <Text variant="caption" color="textSecondary">
            {t('common.copy')}
          </Text>
        </Pressable>
      </Animated.View>

      <View className="gap-sm">
        {preApproval.visitor_phone?.trim() ? (
          <Button
            label={t('resident.preapprove.saveFrequentVisitor')}
            variant="outlined"
            icon="person_add"
            loading={saveFrequentVisitor.isPending}
            onPress={() => {
              saveFrequentVisitor.mutate({
                visitor_name: preApproval.visitor_name,
                visitor_phone: preApproval.visitor_phone!,
                visitor_type: preApproval.type,
              });
            }}
          />
        ) : null}
        <Button
          label={t('resident.preapprove.viewAllPreapprovals')}
          variant="text"
          onPress={() => router.push('/(resident)/(approvals)')}
        />
        {canRevoke && (
          <Button
            label={t('resident.preapprove.revokePreapproval')}
            variant="danger"
            icon="cancel"
            loading={revokePreApproval.isPending}
            onPress={revoke}
          />
        )}
      </View>

      <Text variant="footnote" color="textSecondary" className="text-center">
        {t('resident.preapprove.qrSingleUse')}
      </Text>
    </Screen>
  );
}
