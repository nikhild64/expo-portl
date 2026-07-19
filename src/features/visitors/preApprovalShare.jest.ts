import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Linking } from 'react-native';

import {
  captureQrPng,
  openUrl,
  shareEmail,
  shareQrImage,
  shareSms,
  shareWhatsApp,
  type ShareContext,
} from './preApprovalShare';
import type { PreApprovalQrCodeRef } from './PreApprovalQrCode';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockOpenURL = jest.fn<any>();
jest.mock('react-native', () => ({
  Linking: { openURL: (...args: unknown[]) => mockOpenURL(...args) },
}));

const mockAlert = jest.fn<any>();
jest.mock('@/lib/alert', () => ({
  alert: (...args: unknown[]) => mockAlert(...args),
}));

const mockWriteAsStringAsync = jest.fn<any>();
jest.mock('expo-file-system/legacy', () => ({
  get cacheDirectory() { return 'file:///cache/'; },
  writeAsStringAsync: (...args: unknown[]) => mockWriteAsStringAsync(...args),
  EncodingType: { Base64: 'base64' },
}));

const mockIsAvailableAsync = jest.fn<any>();
const mockComposeAsync = jest.fn<any>();
jest.mock('expo-mail-composer', () => ({
  isAvailableAsync: () => mockIsAvailableAsync(),
  composeAsync: (...args: unknown[]) => mockComposeAsync(...args),
}));

const mockShareAsync = jest.fn<any>();
jest.mock('expo-sharing', () => ({
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CTX: ShareContext = {
  code: 'PORTL-ABC123',
  shareText: 'Visit pass for Alex. Code: PORTL-ABC123',
  shareSubject: 'Visit pass for Alex',
  errorTitle: 'Could not open app',
};

/** Makes a minimal qrRef that calls the callback with a fake base64 string. */
function makeQrRef(base64 = 'aGVsbG8='): React.RefObject<PreApprovalQrCodeRef | null> {
  return {
    current: {
      toDataURL: (cb: (b: string) => void) => cb(base64),
    },
  };
}

function makeEmptyQrRef(): React.RefObject<PreApprovalQrCodeRef | null> {
  return { current: null };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

describe('openUrl', () => {
  it('calls Linking.openURL with the given URL', () => {
    mockOpenURL.mockResolvedValueOnce(undefined);
    openUrl('whatsapp://send?text=hello', 'Error', 'hello');
    expect(mockOpenURL).toHaveBeenCalledWith('whatsapp://send?text=hello');
  });

  it('falls back to alert when Linking rejects', async () => {
    mockOpenURL.mockRejectedValueOnce(new Error('not installed'));
    openUrl('whatsapp://send?text=hello', 'Error title', 'Error body');
    // Wait for the rejected promise to settle
    await Promise.resolve();
    expect(mockAlert).toHaveBeenCalledWith('Error title', 'Error body');
  });
});

describe('captureQrPng', () => {
  it('writes the base64 data to the cache directory and returns the file path', async () => {
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined);
    const ref = makeQrRef('ZGF0YQ==');

    const path = await captureQrPng(ref, 'PORTL-ABC123');

    expect(mockWriteAsStringAsync).toHaveBeenCalledWith(
      'file:///cache/preapproval-qr-PORTL-ABC123.png',
      'ZGF0YQ==',
      { encoding: 'base64' },
    );
    expect(path).toBe('file:///cache/preapproval-qr-PORTL-ABC123.png');
  });

  it('rejects when the QR ref is not yet mounted', async () => {
    await expect(captureQrPng(makeEmptyQrRef(), 'PORTL-ABC123')).rejects.toThrow('QR ref not ready');
  });

  it('rejects when writeAsStringAsync throws', async () => {
    mockWriteAsStringAsync.mockRejectedValueOnce(new Error('disk full'));
    await expect(captureQrPng(makeQrRef(), 'PORTL-ABC123')).rejects.toThrow('disk full');
  });
});

describe('shareWhatsApp', () => {
  it('opens the WhatsApp URL scheme with the share text encoded', () => {
    mockOpenURL.mockResolvedValueOnce(undefined);
    shareWhatsApp(CTX);
    expect(mockOpenURL).toHaveBeenCalledWith(
      `whatsapp://send?text=${encodeURIComponent(CTX.shareText)}`,
    );
  });
});

describe('shareSms', () => {
  it('opens the sms: URL scheme with the body encoded', () => {
    mockOpenURL.mockResolvedValueOnce(undefined);
    shareSms(CTX);
    expect(mockOpenURL).toHaveBeenCalledWith(
      `sms:?body=${encodeURIComponent(CTX.shareText)}`,
    );
  });
});

describe('shareEmail', () => {
  it('opens MailComposer with subject, body, and QR attachment when mail is available', async () => {
    mockIsAvailableAsync.mockResolvedValueOnce(true);
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined);
    mockComposeAsync.mockResolvedValueOnce({ status: 'sent' });

    await shareEmail(CTX, makeQrRef());

    expect(mockComposeAsync).toHaveBeenCalledWith({
      subject: CTX.shareSubject,
      body: CTX.shareText,
      attachments: ['file:///cache/preapproval-qr-PORTL-ABC123.png'],
    });
  });

  it('opens MailComposer without attachment when QR capture fails', async () => {
    mockIsAvailableAsync.mockResolvedValueOnce(true);
    // writeAsStringAsync throws, so captureQrPng rejects → filePath becomes null
    mockWriteAsStringAsync.mockRejectedValueOnce(new Error('disk error'));
    mockComposeAsync.mockResolvedValueOnce({ status: 'sent' });

    await shareEmail(CTX, makeQrRef());

    expect(mockComposeAsync).toHaveBeenCalledWith({
      subject: CTX.shareSubject,
      body: CTX.shareText,
    });
  });

  it('falls back to mailto: deep-link when MailComposer is not available', async () => {
    mockIsAvailableAsync.mockResolvedValueOnce(false);
    mockOpenURL.mockResolvedValueOnce(undefined);

    await shareEmail(CTX, makeQrRef());

    expect(mockComposeAsync).not.toHaveBeenCalled();
    expect(mockOpenURL).toHaveBeenCalledWith(
      `mailto:?subject=${encodeURIComponent(CTX.shareSubject)}&body=${encodeURIComponent(CTX.shareText)}`,
    );
  });

  it('shows an alert when MailComposer.composeAsync throws', async () => {
    mockIsAvailableAsync.mockResolvedValueOnce(true);
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined);
    mockComposeAsync.mockRejectedValueOnce(new Error('compose failed'));

    await shareEmail(CTX, makeQrRef());

    expect(mockAlert).toHaveBeenCalledWith(CTX.errorTitle, CTX.shareText);
  });
});

describe('shareQrImage', () => {
  it('captures the QR and opens the system share sheet', async () => {
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined);
    mockShareAsync.mockResolvedValueOnce(undefined);

    await shareQrImage(CTX, makeQrRef());

    expect(mockShareAsync).toHaveBeenCalledWith(
      'file:///cache/preapproval-qr-PORTL-ABC123.png',
      { mimeType: 'image/png', dialogTitle: CTX.shareSubject, UTI: 'public.png' },
    );
  });

  it('shows an alert when the QR ref is missing', async () => {
    await shareQrImage(CTX, makeEmptyQrRef());
    expect(mockShareAsync).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith(CTX.errorTitle, CTX.shareText);
  });

  it('shows an alert when Sharing.shareAsync throws', async () => {
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined);
    mockShareAsync.mockRejectedValueOnce(new Error('share failed'));

    await shareQrImage(CTX, makeQrRef());

    expect(mockAlert).toHaveBeenCalledWith(CTX.errorTitle, CTX.shareText);
  });
});
