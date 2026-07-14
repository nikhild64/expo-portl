import { useRef, useState } from 'react';
import { alertError, alertWarning } from '@/lib/alert';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { Button, IconSymbol, Text } from '@/components';
import { uploadPrivateImage } from '@/lib/imageUpload';
import { isLocalUri, useSignedUrl, VISITOR_PHOTOS_BUCKET } from '@/lib/storage';

interface Props {
  value?: string;
  onCaptured: (path: string) => void;
}

export function PhotoCaptureField({ value, onCaptured }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [open, setOpen] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string>();
  const [busy, setBusy] = useState(false);
  const previewUri = value && isLocalUri(value) ? value : undefined;
  const { data: signedPreviewUrl } = useSignedUrl(VISITOR_PHOTOS_BUCKET, previewUri ? undefined : value);
  const displayUri = previewUri ?? signedPreviewUrl;

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        alertWarning(t('alert.titles.cameraPermissionRequired'), t('alert.messages.grantCameraPhotos'));
        return;
      }
    }
    setOpen(true);
  };

  const capture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) setCapturedUri(photo.uri);
    } catch (error) {
      alertError(t('alert.titles.captureFailed'), error, t('guard.entry.captureFailedMsg'));
    }
  };

  const accept = async () => {
    if (!capturedUri) return;
    setBusy(true);
    try {
      const path = await uploadPrivateImage(VISITOR_PHOTOS_BUCKET, capturedUri, {
        width: 800,
        compress: 0.78,
      });
      onCaptured(path);
      setOpen(false);
      setCapturedUri(undefined);
    } catch (error) {
      alertError(t('alert.titles.photoUploadFailed'), error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable onPress={openCamera} accessibilityRole="button" accessibilityLabel={t('guard.entry.capture')} android_ripple={{ color: 'rgba(249,112,102,0.15)' }}>
        <View className="min-h-[112px] items-center justify-center gap-sm rounded-lg border border-dashed border-coral bg-surface-secondary">
          {displayUri ? (
            <Image source={{ uri: displayUri }} style={{ width: '100%', height: 160, borderRadius: 18 }} contentFit="cover" />
          ) : (
            <>
              <IconSymbol name="photo_camera" size={34} color="coral" />
              <Text variant="footnote" color="textSecondary">
                {t('guard.entry.tapCapturePhoto')}
              </Text>
            </>
          )}
        </View>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-text-primary">
          {capturedUri ? (
            <Image source={{ uri: capturedUri }} style={{ flex: 1 }} contentFit="cover" />
          ) : (
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" animateShutter />
          )}

          <View
            className="absolute left-lg right-lg gap-md rounded-md bg-text-primary/80 p-lg"
            style={{ bottom: Math.max(insets.bottom, 16) }}
          >
            {capturedUri ? (
              <View className="w-full flex-row gap-md">
                <View className="min-w-0 flex-1">
                  <Button
                    label={t('guard.entry.retake')}
                    variant="outlined"
                    full
                    disabled={busy}
                    onPress={() => setCapturedUri(undefined)}
                  />
                </View>
                <View className="min-w-0 flex-1">
                  <Button label={t('guard.entry.usePhoto')} full loading={busy} onPress={accept} />
                </View>
              </View>
            ) : (
              <View className="w-full flex-row gap-md">
                <View className="min-w-0 flex-1">
                  <Button label={t('common.close')} variant="outlined" full onPress={() => setOpen(false)} />
                </View>
                <View className="min-w-0 flex-1">
                  <Button label={t('guard.entry.capture')} icon="photo_camera" full onPress={capture} />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
