# Share-link worker

Cloudflare Worker that backs the `Share link` button in the main
app. Stores opaque program payloads in KV under short ids and serves
them back.

The worker has no knowledge of the wire format - it stores bytes and
returns bytes. Versioning and validation live in the frontend
([../src/io/program-share.ts](../src/io/program-share.ts)).

## API

```text
POST /r           text/plain body, returns { "id": "<8-char-id>" }
                  413 if body > 10 KB
                  429 if per-IP > 10 POST/min
                  403 if Origin not in ALLOWED_ORIGINS

GET  /r/:id       returns the stored payload as text/plain
                  404 if expired (30-day TTL) or missing
```

## One-time setup

1. `npm install` here.
2. `npx wrangler login` (browser auth to your Cloudflare account).
3. Create a KV namespace in the Cloudflare dashboard
   (`Storage & databases` -> `KV` -> `Create a namespace`) named
   `ARB_SHARES`. Copy the namespace `id` into
   [wrangler.toml](wrangler.toml). Or use the CLI:
   `npx wrangler kv namespace create ARB_SHARES`.
4. `npm run deploy` once manually so the worker is registered and
   you can read its public URL (something like
   `https://acro-routine-builder-share.<account>.workers.dev`).
5. Set the GitHub repo variable `SHARE_SHORTENER_URL` to that URL.
   The Pages deploy workflow threads it into the bundle as
   `__SHARE_SHORTENER_URL__`.

After this, pushes to `main` that touch `worker/**` redeploy the
worker via [.github/workflows/deploy-worker.yml](../.github/workflows/deploy-worker.yml).

## Required GitHub secrets / vars

- `CF_API_TOKEN` (secret) - Cloudflare API token with
  `Workers Scripts:Edit` and `Workers KV Storage:Edit` for the
  account.
- `CF_ACCOUNT_ID` (secret) - Cloudflare account id.
- `SHARE_SHORTENER_URL` (variable) - the deployed worker URL,
  threaded into the Pages build.

## Local development

```sh
npm run dev
# then in the project root:
SHARE_SHORTENER_URL=http://localhost:8787 npm run dev
```

## Notes

- Per-IP rate limit is implemented in KV (best-effort, eventually
  consistent). It's a casual-abuse barrier, not a security
  boundary. If real spam shows up, swap in Cloudflare Turnstile.
- TTL is 30 days. Recipients of share links should be told that up
  front; the toast in the app does this.
- The worker logs only id, status and the connecting IP - never
  payload contents.
