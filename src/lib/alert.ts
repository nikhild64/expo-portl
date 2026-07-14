import type { TFunction } from 'i18next';

import i18n from '@/i18n';

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

export function resolveDialogButtons(buttons?: DialogButton[]): DialogButton[] {
  return buttons?.length ? buttons : [{ text: i18n.t('common.ok') }];
}

/** Fallback when callers omit an explicit tone — structural cues only. */
export function inferDialogTone(title: string, _message?: string, buttons?: DialogButton[]): DialogTone {
  if (buttons?.some((button) => button.style === 'destructive')) return 'destructive';
  if (title.includes('?')) return 'confirm';
  return 'info';
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/** Show an error dialog with a normalized message from a caught value. */
export function alertError(title: string, error: unknown, fallback?: string): void {
  alert(title, errorMessage(error, fallback ?? i18n.t('common.pleaseTryAgain')), undefined, { tone: 'error' });
}

export function alertSuccess(title: string, message?: string, buttons?: DialogButton[]): void {
  alert(title, message, buttons, { tone: 'success' });
}

export function alertWarning(title: string, message?: string, buttons?: DialogButton[]): void {
  alert(title, message, buttons, { tone: 'warning' });
}

export function alertConfirm(title: string, message?: string, buttons?: DialogButton[]): void {
  alert(title, message, buttons, { tone: 'confirm' });
}

/** Cancel + destructive confirm (delete, reject, revoke, etc.). */
export function alertConfirmDestructive(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  options?: { cancelLabel?: string; confirmLabel?: string },
): void {
  alertConfirm(title, message, [
    { text: options?.cancelLabel ?? i18n.t('common.cancel'), style: 'cancel' },
    {
      text: options?.confirmLabel ?? i18n.t('common.delete'),
      style: 'destructive',
      onPress: () => void onConfirm(),
    },
  ]);
}

export function confirmSignOut(
  t: TFunction,
  signOut: () => void | Promise<void>,
  options?: { titleKey?: string; messageKey?: string },
) {
  alertConfirm(t(options?.titleKey ?? 'settings.signOutConfirm'), t(options?.messageKey ?? 'settings.signOutMsg'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('common.signOut'), style: 'destructive', onPress: () => void signOut() },
  ]);
}

export function alertFlatRequired(t: TFunction, messageKey: string) {
  alertWarning(t('alert.titles.flatRequired'), t(messageKey));
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
