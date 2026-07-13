import { useState } from 'react';
import { Alert, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useSegments, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Screen, Text } from '@/components';
import { supabase } from '@/lib/supabase';
import { useVerifyPreApproval } from '@/queries/useVerifyPreApproval';
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
  const segments = useSegments();
  const profile = useAuthStore((s) => s.profile);
  const verify = useVerifyPreApproval();
  const queryClient = useQueryClient();
  const isHomeStack = (segments as readonly string[]).includes('(home)');

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || verify.isPending) return;
    setScanned(true);

    const code = parseQrCode(data);
    if (!code) {
      Alert.alert('Invalid QR', 'Please scan a Portl visitor QR.', [{ text: 'Scan again', onPress: () => setScanned(false) }]);
      return;
    }

    try {
      const result = await verify.mutateAsync(code);
      if (!result.valid || !result.flat_id || !result.type || !result.visitor_name || !result.pre_approval_id) {
        Alert.alert('QR not accepted', reasonText(result.reason), [{ text: 'Scan again', onPress: () => setScanned(false) }]);
        return;
      }

      if (!profile?.id || !profile.society_id) throw new Error('Guard profile is not ready yet.');

      const { data: visitor, error: insertError } = await supabase
        .from('visitors')
        .insert({
          flat_id: result.flat_id,
          guard_id: profile.id,
          pre_approval_id: result.pre_approval_id,
          pre_approved: true,
          purpose: 'Pre-approved visit',
          society_id: profile.society_id,
          status: 'approved',
          type: result.type,
          visitor_name: result.visitor_name,
          visitor_phone: result.visitor_phone,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('pre_approvals')
        .update({ qr_used_at: new Date().toISOString() })
        .eq('id', result.pre_approval_id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['guard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['guard-activity'] });
      router.replace(`/(guard)/${isHomeStack ? '(home)' : '(add)'}/verify/${visitor.id}` as Href);
    } catch (error) {
      Alert.alert('Could not verify QR', error instanceof Error ? error.message : 'Please try again.', [
        { text: 'Scan again', onPress: () => setScanned(false) },
      ]);
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
        <Button label={verify.isPending ? 'Verifying...' : 'Cancel scan'} variant="outlined" onPress={() => router.back()} />
      </View>
    </View>
  );
}
