export type DialogButtonStyle = 'default' | 'cancel' | 'destructive';

export interface DialogButton {
  text?: string;
  onPress?: () => void | Promise<void>;
  style?: DialogButtonStyle;
  isPreferred?: boolean;
}

export type DialogTone = 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'destructive';

export interface DialogRequest {
  id: string;
  title: string;
  message?: string;
  buttons: DialogButton[];
  tone: DialogTone;
}

type AlertFn = (
  title: string,
  message?: string,
  buttons?: DialogButton[],
  options?: { tone?: DialogTone },
) => void;

let showAlertImpl: AlertFn | null = null;

export function registerAlertImpl(fn: AlertFn) {
  showAlertImpl = fn;
}

export function unregisterAlertImpl(fn: AlertFn) {
  if (showAlertImpl === fn) {
    showAlertImpl = null;
  }
}

const DEFAULT_BUTTONS: DialogButton[] = [{ text: 'OK' }];

export function inferDialogTone(title: string, message?: string, buttons?: DialogButton[]): DialogTone {
  if (buttons?.some((button) => button.style === 'destructive')) return 'destructive';
  if (title.includes('?')) return 'confirm';

  const text = `${title} ${message ?? ''}`.toLowerCase();
  if (
    text.includes('failed') ||
    text.includes('could not') ||
    text.includes('invalid') ||
    text.includes('error') ||
    text.includes('not accepted')
  ) {
    return 'error';
  }
  if (
    text.includes('saved') ||
    text.includes('created') ||
    text.includes('confirmed') ||
    text.includes('updated') ||
    text.includes('copied') ||
    text.includes('sent') ||
    text.includes('queued') ||
    text.includes('generated')
  ) {
    return 'success';
  }
  if (text.includes('permission') || text.includes('required') || text.includes('unavailable')) {
    return 'warning';
  }

  return 'info';
}

/** Drop-in replacement for React Native `Alert.alert`. */
export function alert(
  title: string,
  message?: string,
  buttons?: DialogButton[],
  options?: { tone?: DialogTone },
): void {
  if (!showAlertImpl) {
    console.warn('[alert] DialogProvider is not mounted');
    return;
  }

  showAlertImpl(title, message, buttons, options);
}

export function resolveDialogButtons(buttons?: DialogButton[]): DialogButton[] {
  return buttons?.length ? buttons : DEFAULT_BUTTONS;
}
