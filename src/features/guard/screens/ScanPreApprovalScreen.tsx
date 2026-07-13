import { useState } from 'react';
import { alert } from '@/lib/alert';
import { View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useSegments } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button, Card, Screen, Text } from '@/components';
import { supabase } from '@/lib/supabase';

function parseQrCode(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol.toLowerCase() !== 'portl-nd:' || url.host !== 'gate') return null;
    return url.searchParams.get('code');
  } catch {
    return value.startsWith('PORTL-') ? value : null;
  }
}

export function GuardScanPreApprovalScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [busy, setBusy] = useState(false);
  const segments = useSegments();
  const queryClient = useQueryClient();
  const isHomeStack = (segments as readonly string[]).includes('(home)');

  const reasonText = (reason: string) => {
    switch (reason) {
      case 'already_used':
        return t('guard.scan.qrAlreadyUsed');
      case 'out_of_window':
        return t('guard.scan.qrOutOfWindow');
      case 'wrong_society':
        return t('guard.scan.qrWrongSociety');
      case 'not_authorized':
        return t('guard.scan.qrNotAuthorized');
      default:
        return t('guard.scan.qrInvalid');
    }
  };

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || busy) return;
    setScanned(true);
    setBusy(true);

    const code = parseQrCode(data);
    if (!code) {
      setBusy(false);
      alert(t('alert.titles.invalidQr'), t('alert.messages.scanPortlQr'), [
        { text: t('alert.buttons.scanAgain'), onPress: () => setScanned(false) },
      ]);
      return;
    }

    try {
      const { data: rows, error } = await supabase.rpc('consume_preapproval', { p_code: code });
      if (error) throw error;

      const result = rows?.[0];
      if (!result?.valid || !result.visitor_id) {
        alert(t('alert.titles.qrNotAccepted'), reasonText(result?.reason ?? 'invalid_code'), [
          { text: t('alert.buttons.scanAgain'), onPress: () => setScanned(false) },
        ]);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['guard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['guard-activity'] });
      router.replace({
        pathname: isHomeStack ? '/(guard)/(home)/verify/[visitorId]' : '/(guard)/(add)/verify/[visitorId]',
        params: { visitorId: result.visitor_id },
      });
    } catch (error) {
      alert(
        t('alert.titles.couldNotVerifyQr'),
        error instanceof Error ? error.message : t('common.pleaseTryAgain'),
        [{ text: t('alert.buttons.scanAgain'), onPress: () => setScanned(false) }],
      );
    } finally {
      setBusy(false);
    }
  };

  if (!permission) {
    return <Screen />;
  }

  if (!permission.granted) {
    return (
      <Screen className="justify-center">
        <Card className="gap-md">
          <Text variant="title">{t('guard.scan.cameraPermission')}</Text>
          <Text variant="body" color="textSecondary">
            {t('guard.scan.allowCamera')}
          </Text>
          <Button label={t('guard.scan.allowCameraButton')} onPress={requestPermission} />
        </Card>
      </Screen>
    );
  }

  return (
    <View className="flex-1 bg-text-primary">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />
      <View className="absolute left-lg right-lg" style={{ top: Math.max(insets.top, 16) }}>
        <Card className="gap-xs bg-text-primary/80">
          <Text variant="headline" color="onPrimary">
            {t('guard.scan.title')}
          </Text>
          <Text variant="footnote" color="onPrimary">
            {t('guard.scan.alignQr')}
          </Text>
        </Card>
      </View>
      <View className="absolute left-lg right-lg" style={{ bottom: Math.max(insets.bottom, 16) }}>
        <Button label={busy ? t('common.loading') : t('common.cancel')} variant="outlined" onPress={() => router.back()} />
      </View>
    </View>
  );
}
