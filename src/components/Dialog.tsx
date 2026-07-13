import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Button } from './Button';
import { Card } from './Card';
import { IconSymbol, type IconName } from './IconSymbol';
import { Text } from './Text';
import {
  alert as alertFn,
  inferDialogTone,
  registerAlertImpl,
  resolveDialogButtons,
  unregisterAlertImpl,
  type DialogButton,
  type DialogRequest,
  type DialogTone,
} from '@/lib/alert';
import type { ThemeColor } from '@/theme';

const toneConfig: Record<DialogTone, { icon: IconName; iconColor: ThemeColor; iconBg: string }> = {
  info: { icon: 'info', iconColor: 'info', iconBg: 'bg-surface-secondary' },
  success: { icon: 'check_circle', iconColor: 'success', iconBg: 'bg-sage-light' },
  warning: { icon: 'warning_amber', iconColor: 'warning', iconBg: 'bg-surface-tertiary' },
  error: { icon: 'error_outline', iconColor: 'error', iconBg: 'bg-surface-tertiary' },
  confirm: { icon: 'info', iconColor: 'coral', iconBg: 'bg-coral-light' },
  destructive: { icon: 'warning_amber', iconColor: 'error', iconBg: 'bg-surface-tertiary' },
};

function createRequest(
  title: string,
  message?: string,
  buttons?: DialogButton[],
  tone?: DialogTone,
): DialogRequest {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    message,
    buttons: resolveDialogButtons(buttons),
    tone: tone ?? inferDialogTone(title, message, buttons),
  };
}

function orderButtons(buttons: DialogButton[], stacked: boolean): DialogButton[] {
  if (!stacked) return buttons;

  const cancelButtons = buttons.filter((button) => button.style === 'cancel');
  const otherButtons = buttons.filter((button) => button.style !== 'cancel');
  return [...otherButtons, ...cancelButtons];
}

function DialogContent({
  request,
  onDismiss,
}: {
  request: DialogRequest;
  onDismiss: (button: DialogButton) => void;
}) {
  const tone = toneConfig[request.tone];
  const stacked = request.buttons.length > 2;
  const buttons = useMemo(() => orderButtons(request.buttons, stacked), [request.buttons, stacked]);

  return (
    <Card variant="elevated" padding="lg" className="w-full max-w-[360px] gap-lg">
      <View className="items-center gap-md">
        <View className={`h-12 w-12 items-center justify-center rounded-full ${tone.iconBg}`}>
          <IconSymbol name={tone.icon} size={24} color={tone.iconColor} />
        </View>
        <View className="items-center gap-xs">
          <Text variant="title" className="text-center">
            {request.title}
          </Text>
          {request.message ? (
            <Text variant="body" color="textSecondary" className="text-center">
              {request.message}
            </Text>
          ) : null}
        </View>
      </View>

      <View className={stacked ? 'gap-sm' : 'flex-row gap-sm'}>
        {buttons.map((button, index) => {
          const isCancel = button.style === 'cancel';
          const isDestructive = button.style === 'destructive';
          const variant = isDestructive ? 'danger' : isCancel ? 'outlined' : 'filled';
          const key = `${button.text ?? 'button'}-${index}`;

          return (
            <View key={key} className={stacked ? 'w-full' : 'min-w-0 flex-1'}>
              <Button
                label={button.text ?? (isCancel ? 'Cancel' : 'OK')}
                variant={variant}
                size="sm"
                full
                onPress={() => onDismiss(button)}
              />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const overlay = useCSSVariable('--color-overlay') as string;
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const current = queue[0] ?? null;

  const dismiss = useCallback((button: DialogButton) => {
    void Promise.resolve(button.onPress?.()).finally(() => {
      setQueue((items) => items.slice(1));
    });
  }, []);

  const showAlert = useCallback(
    (title: string, message?: string, buttons?: DialogButton[], options?: { tone?: DialogTone }) => {
      setQueue((items) => [...items, createRequest(title, message, buttons, options?.tone)]);
    },
    [],
  );

  useEffect(() => {
    registerAlertImpl(showAlert);
    return () => unregisterAlertImpl(showAlert);
  }, [showAlert]);

  return (
    <>
      {children}
      <Modal
        visible={!!current}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          const cancelButton = current?.buttons.find((button) => button.style === 'cancel');
          if (cancelButton) dismiss(cancelButton);
          else if (current) dismiss(current.buttons[0]);
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
          className="flex-1 items-center justify-center px-lg"
          style={{ backgroundColor: overlay }}
          onPress={() => {
            const cancelButton = current?.buttons.find((button) => button.style === 'cancel');
            if (cancelButton) dismiss(cancelButton);
          }}
        >
          <Pressable
            accessibilityRole="none"
            className="w-full max-w-[360px]"
            onPress={(event) => event.stopPropagation()}
          >
            {current ? <DialogContent request={current} onDismiss={dismiss} /> : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function useDialog() {
  return { alert: alertFn };
}
