import { useState } from 'react';
import { Alert, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useSegments, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Screen, Text } from '@/components';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

function parseQrCode(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol.toLowerCase() !== 'portl-nd:' || url.host !== 'gate') return null;
    return url.searchParams.get('code');
  } catch {
    return value.startsWith('PORTL-') ? value : null;
  }
}

function reasonText(reason: string) {
  switch (reason) {
    case 'already_used':
      return 'This QR has already been used.';
    case 'out_of_window':
      return 'This QR is not valid for the current time.';
    case 'wrong_society':
      return 'This QR belongs to another society.';
    case 'not_authorized':
      return 'Only guards can verify pre-approvals.';
    default:
      return 'This QR is invalid.';
  }
}

export default function ScanPreApprovalScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [busy, setBusy] = useState(false);
  const segments = useSegments();
  const queryClient = useQueryClient();
  const isHomeStack = (segments as readonly string[]).includes('(home)');

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || busy) return;
    setScanned(true);
    setBusy(true);

    const code = parseQrCode(data);
    if (!code) {
      setBusy(false);
      Alert.alert('Invalid QR', 'Please scan a Portl visitor QR.', [{ text: 'Scan again', onPress: () => setScanned(false) }]);
      return;
    }

    try {
      const { data: rows, error } = await supabase.rpc('consume_preapproval', { p_code: code });
      if (error) throw error;

      const result = rows?.[0];
      if (!result?.valid || !result.visitor_id) {
        Alert.alert('QR not accepted', reasonText(result?.reason ?? 'invalid_code'), [
          { text: 'Scan again', onPress: () => setScanned(false) },
        ]);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['guard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['guard-activity'] });
      router.replace(`/(guard)/${isHomeStack ? '(home)' : '(add)'}/verify/${result.visitor_id}` as Href);
    } catch (error) {
      Alert.alert('Could not verify QR', error instanceof Error ? error.message : 'Please try again.', [
        { text: 'Scan again', onPress: () => setScanned(false) },
      ]);
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
          <Text variant="title">Camera permission needed</Text>
          <Text variant="body" color="textSecondary">
            Allow camera access to scan pre-approval QR codes.
          </Text>
          <Button label="Allow camera" onPress={requestPermission} />
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
            Scan pre-approval QR
          </Text>
          <Text variant="footnote" color="onPrimary">
            Align the visitor QR inside the camera view.
          </Text>
        </Card>
      </View>
      <View className="absolute left-lg right-lg" style={{ bottom: Math.max(insets.bottom, 16) }}>
        <Button label={busy ? 'Verifying...' : 'Cancel scan'} variant="outlined" onPress={() => router.back()} />
      </View>
    </View>
  );
}
