import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { alertError } from '@/lib/alert';
import { Avatar, Button, Sheet, StatusPill, Text, type SheetHandle } from '@/components';
import { visitorGateStatus } from '@/features/visitors/visitorStatus';
import { formatDateTime, formatFlatLabel, titleize } from '@/lib/format';
import { signedUrlForPath, useSignedUrlMap, VISITOR_PHOTOS_BUCKET } from '@/lib/storage';
import type { GuardActivityVisitor } from '@/queries/useGuardActivity';
import { useCancelVisitorRequest, useMarkEntered, useMarkExit } from '@/queries/useVisitorLog';

export interface GuardActivitySheetHandle {
  open: (visitor: GuardActivityVisitor) => void;
  close: () => void;
}

export const GuardActivitySheet = forwardRef<GuardActivitySheetHandle>(function GuardActivitySheet(_, ref) {
  const { t } = useTranslation();
  const sheetRef = useRef<SheetHandle>(null);
  const [visitor, setVisitor] = useState<GuardActivityVisitor | null>(null);
  const cancelRequest = useCancelVisitorRequest();
  const markEntered = useMarkEntered(visitor?.id);
  const markExit = useMarkExit();
  const signedUrlMap = useSignedUrlMap(
    VISITOR_PHOTOS_BUCKET,
    visitor?.visitor_photo_path ? [visitor.visitor_photo_path] : [],
  );

  useImperativeHandle(ref, () => ({
    open: (nextVisitor) => {
      setVisitor(nextVisitor);
      setTimeout(() => sheetRef.current?.present(), 0);
    },
    close: () => sheetRef.current?.dismiss(),
  }));

  const status = visitor ? visitorGateStatus(visitor, { uppercase: true }) : null;
  const flatLabel = visitor ? formatFlatLabel(visitor.flats?.towers?.name, visitor.flats?.number) : '';
  const time = visitor ? (visitor.exited_at ?? visitor.entered_at ?? visitor.requested_at) : null;
  const imageUri = visitor
    ? signedUrlForPath(signedUrlMap, visitor.visitor_photo_path, VISITOR_PHOTOS_BUCKET)
    : undefined;
  const isPending = visitor?.status === 'pending';
  const isApproved = visitor?.status === 'approved';
  const isInside = !!visitor?.entered_at && !visitor?.exited_at;

  const dismiss = () => sheetRef.current?.dismiss();

  const handleCancel = () => {
    if (!visitor) return;
    cancelRequest.mutate(visitor.id, {
      onSuccess: dismiss,
      onError: (error) => alertError(t('alert.titles.couldNotCancelRequest'), error),
    });
  };

  const handleMarkEntered = () => {
    markEntered.mutate(undefined, {
      onSuccess: dismiss,
      onError: (error) => alertError(t('alert.titles.couldNotMarkEntry'), error),
    });
  };

  const handleMarkExit = () => {
    if (!visitor) return;
    markExit.mutate(visitor.id, {
      onSuccess: dismiss,
      onError: (error) => alertError(t('alert.titles.couldNotMarkExit'), error),
    });
  };

  const handleViewWaiting = () => {
    if (!visitor) return;
    dismiss();
    router.push({
      pathname: '/(guard)/(home)/waiting/[visitorId]',
      params: { visitorId: visitor.id },
    });
  };

  return (
    <Sheet ref={sheetRef} snapPoints={isPending || isApproved || isInside ? ['52%'] : ['42%']}>
      {visitor && status && time ? (
        <View className="gap-lg pb-lg">
          <View className="flex-row items-center gap-md">
            <Avatar
              imageUri={imageUri}
              name={visitor.visitor_name}
              storageBucket={imageUri ? undefined : VISITOR_PHOTOS_BUCKET}
              uri={imageUri ? undefined : visitor.visitor_photo_path}
              size="lg"
            />
            <View className="flex-1 gap-xs">
              <Text variant="title">{visitor.visitor_name}</Text>
              <Text variant="footnote" color="textSecondary">
                {titleize(visitor.type)} · {flatLabel}
              </Text>
              <Text variant="caption" color="textTertiary">
                {formatDateTime(time)}
              </Text>
            </View>
            <StatusPill tone={status.tone} label={status.label} />
          </View>

          <View className="gap-sm">
            {isPending && (
              <>
                <Button label={t('guard.activity.viewRequest')} icon="schedule" full onPress={handleViewWaiting} />
                <Button
                  label={t('guard.waiting.cancelRequest')}
                  variant="outlined"
                  full
                  loading={cancelRequest.isPending}
                  onPress={handleCancel}
                />
              </>
            )}

            {isApproved && (
              <>
                <Button
                  label={t('guard.waiting.markEntered')}
                  icon="check_circle"
                  full
                  loading={markEntered.isPending}
                  onPress={handleMarkEntered}
                />
                <Button label={t('guard.activity.viewRequest')} variant="outlined" full onPress={handleViewWaiting} />
              </>
            )}

            {isInside && (
              <Button
                label={t('guard.log.markExit')}
                full
                loading={markExit.isPending}
                onPress={handleMarkExit}
              />
            )}

            {!isPending && !isApproved && !isInside && (
              <Button label={t('common.close')} variant="tonal" full onPress={dismiss} />
            )}
          </View>
        </View>
      ) : null}
    </Sheet>
  );
});
