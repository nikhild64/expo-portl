import { useCallback, useState } from 'react';
import { alert, errorMessage } from '@/lib/alert';
import { View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useSegments } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button, Card, Field, Screen, Sheet, Text, useSheet } from '@/components';
import {
  PREAPPROVAL_CODE_PREFIX,
  PREAPPROVAL_CODE_SUFFIX_LENGTH,
  formatPreApprovalCodeFromSuffix,
  isPreApprovalCodeSuffix,
  parsePreApprovalCode,
  sanitizePreApprovalCodeSuffix,
} from '@/features/guard/parsePreApprovalCode';
import { guardVerifyHref } from '@/lib/guardRoutes';
import { invalidateGuardActivity } from '@/lib/guardQueries';
import { supabase } from '@/lib/supabase';

export function GuardScanPreApprovalScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const segments = useSegments();
  const queryClient = useQueryClient();
  const codeSheet = useSheet();

  const reasonText = useCallback(
    (reason: string) => {
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
    },
    [t],
  );

  const resetScan = useCallback(() => {
    setScanned(false);
    setBusy(false);
  }, []);

  const submitCode = useCallback(
    async (raw: string) => {
      if (busy) return;

      const code = parsePreApprovalCode(raw);
      if (!code) {
        alert(t('alert.titles.invalidQr'), t('alert.messages.scanPortlQr'), [
          { text: t('alert.buttons.scanAgain'), onPress: resetScan },
        ]);
        return;
      }

      setScanned(true);
      setBusy(true);

      let success = false;
      try {
        const { data: rows, error } = await supabase.rpc('consume_preapproval', { p_code: code });
        if (error) throw error;

        const result = rows?.[0];
        if (!result?.valid || !result.visitor_id) {
          alert(t('alert.titles.qrNotAccepted'), reasonText(result?.reason ?? 'invalid_code'), [
            { text: t('alert.buttons.scanAgain'), onPress: resetScan },
          ]);
          return;
        }

        success = true;
        codeSheet.dismiss();
        void invalidateGuardActivity(queryClient);

        // Delay routing to avoid expo-camera unmount crash immediately after scanning
        setTimeout(() => {
          router.replace(guardVerifyHref(segments, result.visitor_id as string));
        }, 400);
      } catch (error) {
        alert(
          t('alert.titles.couldNotVerifyQr'),
          errorMessage(error, t('common.pleaseTryAgain')),
          [{ text: t('alert.buttons.scanAgain'), onPress: resetScan }],
          { tone: 'error' },
        );
      } finally {
        if (!success) {
          setBusy(false);
        }
      }
    },
    [busy, codeSheet, queryClient, reasonText, resetScan, segments, t],
  );

  const handleScan = useCallback(
    ({ data }: { data: string }) => {
      if (scanned || busy || !isFocused) return;
      void submitCode(data);
    },
    [busy, isFocused, scanned, submitCode],
  );

  const openManualEntry = () => {
    setManualCode('');
    resetScan();
    codeSheet.present();
  };

  const submitManualCode = () => {
    const code = formatPreApprovalCodeFromSuffix(manualCode);
    if (!code) {
      alert(t('alert.titles.invalidQr'), t('alert.messages.scanPortlQr'), [
        { text: t('alert.buttons.scanAgain'), onPress: resetScan },
      ]);
      return;
    }
    void submitCode(code);
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

  const scanningEnabled = isFocused && !scanned && !busy;

  return (
    <View className="flex-1 bg-text-primary">
      {isFocused ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          active={scanningEnabled}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanningEnabled ? handleScan : undefined}
        />
      ) : (
        <View className="flex-1 bg-text-primary" />
      )}
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
      <View className="absolute left-lg right-lg gap-sm" style={{ bottom: Math.max(insets.bottom, 16) }}>
        <Button
          label={t('guard.scan.enterCode')}
          variant="outlined"
          disabled={busy}
          onPress={openManualEntry}
        />
        <Button label={busy ? t('common.loading') : t('common.cancel')} variant="text" onPress={() => router.back()} />
      </View>

      <Sheet ref={codeSheet.ref} snapPoints={['50%']} keyboard>
        <View className="gap-md">
          <View className="gap-xs">
            <Text variant="title">{t('guard.scan.enterCodeTitle')}</Text>
            <Text variant="body" color="textSecondary">
              {t('guard.scan.enterCodeHint')}
            </Text>
          </View>
          <View className="gap-xs">
            <Text variant="footnote" color="textSecondary">
              {t('guard.scan.enterCode')}
            </Text>
            <View className="flex-row items-center gap-sm">
              <Text variant="headline" className="tracking-wide">
                {PREAPPROVAL_CODE_PREFIX}
              </Text>
              <View className="flex-1">
                <Field
                  sheet
                  value={manualCode}
                  onChangeText={(text) => setManualCode(sanitizePreApprovalCodeSuffix(text))}
                  placeholder={'X'.repeat(PREAPPROVAL_CODE_SUFFIX_LENGTH)}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={PREAPPROVAL_CODE_SUFFIX_LENGTH}
                  returnKeyType="done"
                  onSubmitEditing={submitManualCode}
                />
              </View>
            </View>
          </View>
          <Button
            label={busy ? t('common.loading') : t('guard.scan.verifyCode')}
            disabled={!isPreApprovalCodeSuffix(manualCode) || busy}
            onPress={submitManualCode}
          />
        </View>
      </Sheet>
    </View>
  );
}
