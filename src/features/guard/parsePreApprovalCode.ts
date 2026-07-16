const PREAPPROVAL_CODE = /PORTL-[A-Z0-9]{6}/i;
const PREAPPROVAL_CODE_SUFFIX = /^[A-Z0-9]{6}$/i;

export const PREAPPROVAL_CODE_PREFIX = 'PORTL-';
export const PREAPPROVAL_CODE_SUFFIX_LENGTH = 6;

/** Accepts plain PORTL-XXXXXX codes (preferred in QR) and legacy portl-nd://gate deep links. */
export function parsePreApprovalCode(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const embedded = trimmed.match(PREAPPROVAL_CODE);
  if (embedded) return embedded[0].toUpperCase();

  try {
    const url = new URL(trimmed);
    if (url.protocol.toLowerCase() !== 'portl-nd:' || url.hostname !== 'gate') return null;
    const code = url.searchParams.get('code')?.trim();
    return code && PREAPPROVAL_CODE.test(code) ? code.toUpperCase() : null;
  } catch {
    return null;
  }
}

export function isPreApprovalCodeSuffix(value: string) {
  return PREAPPROVAL_CODE_SUFFIX.test(value.trim());
}

export function formatPreApprovalCodeFromSuffix(suffix: string): string | null {
  const normalized = suffix.trim().toUpperCase();
  if (!PREAPPROVAL_CODE_SUFFIX.test(normalized)) return null;
  return `${PREAPPROVAL_CODE_PREFIX}${normalized}`;
}

export function sanitizePreApprovalCodeSuffix(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, PREAPPROVAL_CODE_SUFFIX_LENGTH);
}
