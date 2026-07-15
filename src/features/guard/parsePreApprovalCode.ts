const PREAPPROVAL_CODE = /PORTL-[A-Z0-9]{6}/i;

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
