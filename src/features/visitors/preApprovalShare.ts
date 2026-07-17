import * as FileSystem from 'expo-file-system/legacy';
import * as MailComposer from 'expo-mail-composer';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';

import { alert } from '@/lib/alert';
import type { PreApprovalQrCodeRef } from './PreApprovalQrCode';

export interface ShareContext {
  /** Pre-approval access code (e.g. "PORTL-ABC123"). */
  code: string;
  /** Human-readable share text sent to WhatsApp / SMS. */
  shareText: string;
  /** Subject line for email. */
  shareSubject: string;
  /** i18n key for the "could not open app" alert title. */
  errorTitle: string;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/** Opens a URL, falling back to an alert when Linking fails. */
export function openUrl(url: string, errorTitle: string, errorBody: string): void {
  Linking.openURL(url).catch(() => alert(errorTitle, errorBody));
}

/**
 * Captures the QR code SVG as a PNG file in the app's cache directory.
 * Resolves with the local file URI; rejects when the ref is not yet mounted.
 */
export function captureQrPng(
  qrRef: React.RefObject<PreApprovalQrCodeRef | null>,
  code: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const svgRef = qrRef.current;
    if (!svgRef) return reject(new Error('QR ref not ready'));
    svgRef.toDataURL(async (base64: string) => {
      try {
        const filePath = `${FileSystem.cacheDirectory}preapproval-qr-${code}.png`;
        await FileSystem.writeAsStringAsync(filePath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        resolve(filePath);
      } catch (e) {
        reject(e);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Per-channel share handlers
// ---------------------------------------------------------------------------

/** WhatsApp: deep-links directly to the app with the share text pre-filled. */
export function shareWhatsApp(ctx: ShareContext): void {
  openUrl(
    `whatsapp://send?text=${encodeURIComponent(ctx.shareText)}`,
    ctx.errorTitle,
    ctx.shareText,
  );
}

/** SMS: deep-links to the Messages app with the body pre-filled. */
export function shareSms(ctx: ShareContext): void {
  openUrl(`sms:?body=${encodeURIComponent(ctx.shareText)}`, ctx.errorTitle, ctx.shareText);
}

/**
 * Email: opens the native mail-composer with subject, body, and the QR PNG as
 * an attachment.  Falls back to a `mailto:` deep-link when no mail client is
 * configured on the device.
 */
export async function shareEmail(
  ctx: ShareContext,
  qrRef: React.RefObject<PreApprovalQrCodeRef | null>,
): Promise<void> {
  try {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      openUrl(
        `mailto:?subject=${encodeURIComponent(ctx.shareSubject)}&body=${encodeURIComponent(ctx.shareText)}`,
        ctx.errorTitle,
        ctx.shareText,
      );
      return;
    }
    const filePath = await captureQrPng(qrRef, ctx.code).catch(() => null);
    await MailComposer.composeAsync({
      subject: ctx.shareSubject,
      body: ctx.shareText,
      ...(filePath ? { attachments: [filePath] } : {}),
    });
  } catch {
    alert(ctx.errorTitle, ctx.shareText);
  }
}

/**
 * Generic share: saves the QR PNG then opens the system share sheet so the
 * user can pick any app (Telegram, Drive, etc.).
 */
export async function shareQrImage(
  ctx: ShareContext,
  qrRef: React.RefObject<PreApprovalQrCodeRef | null>,
): Promise<void> {
  try {
    const filePath = await captureQrPng(qrRef, ctx.code);
    await Sharing.shareAsync(filePath, {
      mimeType: 'image/png',
      dialogTitle: ctx.shareSubject,
      UTI: 'public.png',
    });
  } catch {
    alert(ctx.errorTitle, ctx.shareText);
  }
}
