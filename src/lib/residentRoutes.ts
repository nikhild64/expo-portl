import type { Href } from 'expo-router';

export function residentPreApprovalQrHref(id: string, segments: readonly string[]): Href {
  const group = (segments as readonly string[]).includes('(home)') ? '(home)' : '(approvals)';
  return `/(resident)/${group}/preapprove/${id}/qr` as Href;
}
