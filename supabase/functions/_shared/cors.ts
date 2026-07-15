const DEFAULT_ORIGINS = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'exp://127.0.0.1:8081',
  'exp://localhost:8081',
];

/** Comma-separated extra origins via ALLOWED_ORIGIN or ALLOWED_ORIGINS. */
export function getAllowedOrigins(): string[] {
  const fromEnv = Deno.env.get('ALLOWED_ORIGIN') ?? Deno.env.get('ALLOWED_ORIGINS') ?? '';
  const extra = fromEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ORIGINS, ...extra])];
}

/** Native invoke/curl often omit Origin — allow those callers. */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;
  return getAllowedOrigins().includes(origin);
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  const base = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (!origin) return base;
  if (!isOriginAllowed(origin)) return base;

  return { ...base, 'Access-Control-Allow-Origin': origin };
}

export function handleCorsPreflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null;

  const origin = req.headers.get('Origin');
  if (origin && !isOriginAllowed(origin)) {
    return new Response('Forbidden', { status: 403 });
  }

  return new Response('ok', { headers: corsHeaders(req) });
}

export function rejectDisallowedOrigin(req: Request): Response | null {
  const origin = req.headers.get('Origin');
  if (origin && !isOriginAllowed(origin)) {
    return new Response(JSON.stringify({ error: 'origin_not_allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}
