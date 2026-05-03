/**
 * Acro Routine Builder share-link worker. Stores opaque program payloads in
 * KV under short ids and serves them back. No knowledge of the wire format -
 * the frontend (program-share.ts) owns versioning and validation.
 */

export interface Env {
  ARB_SHARES: KVNamespace;
  ALLOWED_ORIGINS: string;
}

const MAX_PAYLOAD_BYTES = 10 * 1024;
const TTL_SECONDS = 60 * 60 * 24 * 7;
const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX = 10;
const ID_LENGTH = 8;
const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('Origin');
    const allowedOrigin = pickAllowedOrigin(origin, env);

    if (req.method === 'OPTIONS') {
      return preflight(allowedOrigin);
    }

    const url = new URL(req.url);

    if (req.method === 'POST' && url.pathname === '/r') {
      if (!allowedOrigin) {
        return json({ error: 'Origin not allowed' }, 403, allowedOrigin);
      }
      return handleCreate(req, env, allowedOrigin);
    }

    const m = url.pathname.match(/^\/r\/([^/]+)$/);
    if (req.method === 'GET' && m) {
      return handleRead(m[1], env, allowedOrigin);
    }

    return text('Not found', 404, allowedOrigin);
  },
};

async function handleCreate(req: Request, env: Env, origin: string): Promise<Response> {
  const cl = req.headers.get('Content-Length');
  if (cl && Number(cl) > MAX_PAYLOAD_BYTES) {
    return json({ error: 'Payload too large' }, 413, origin);
  }

  const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (await isRateLimited(env, ip)) {
    return json({ error: 'Rate limit exceeded' }, 429, origin);
  }

  const body = await req.text();
  if (body.length > MAX_PAYLOAD_BYTES) {
    return json({ error: 'Payload too large' }, 413, origin);
  }
  if (!body) {
    return json({ error: 'Empty payload' }, 400, origin);
  }

  const id = generateId();
  await env.ARB_SHARES.put(`s:${id}`, body, { expirationTtl: TTL_SECONDS });
  return json({ id }, 200, origin);
}

async function handleRead(id: string, env: Env, origin: string | null): Promise<Response> {
  if (!ID_PATTERN.test(id)) {
    return text('Invalid id', 400, origin);
  }
  const payload = await env.ARB_SHARES.get(`s:${id}`);
  if (payload === null) {
    return text('Share link expired or not found', 404, origin);
  }
  return text(payload, 200, origin, 'text/plain; charset=utf-8');
}

/**
 * Best-effort per-IP rate limiter using KV. KV writes are eventually
 * consistent so racing requests can each see a stale counter - this is fine
 * for casual abuse but is not a security boundary. Documented as such.
 */
async function isRateLimited(env: Env, ip: string): Promise<boolean> {
  const key = `rl:${ip}`;
  const raw = await env.ARB_SHARES.get(key);
  const count = raw ? Number(raw) : 0;
  if (count >= RATE_LIMIT_MAX) return true;
  await env.ARB_SHARES.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW });
  return false;
}

function generateId(): string {
  const bytes = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    out += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  }
  return out;
}

function pickAllowedOrigin(origin: string | null, env: Env): string | null {
  if (!origin) return null;
  const list = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
  return list.includes(origin) ? origin : null;
}

function preflight(origin: string | null): Response {
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });
}

function corsHeaders(origin: string | null): HeadersInit {
  if (!origin) return {};
  return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
  });
}

function text(body: string, status: number, origin: string | null, type = 'text/plain; charset=utf-8'): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': type, ...corsHeaders(origin) },
  });
}
