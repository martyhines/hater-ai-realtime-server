# Hater AI - Realtime Token Server

Simple Express server that mints ephemeral OpenAI Realtime session tokens.

## Endpoints

- POST `/realtime-token`
  - Returns the JSON received from OpenAI Realtime Sessions API
  - Expects optional header: `Authorization: Bearer <APP_AUTH_TOKEN>` when `APP_AUTH_TOKEN` env var is set
- GET `/health` → `{ ok: true }`

## Env Vars

- `OPENAI_API_KEY` (required)
- `APP_AUTH_TOKEN` (optional; if set, clients must send it in Authorization header)
- `ALLOWED_ORIGIN` (optional; comma-separated list, `*` allowed)
- `REALTIME_MODEL` (default: `gpt-4o-realtime-preview-2024-12-17`)
- `REALTIME_VOICE` (default: `alloy`)
- `REALTIME_TTL` seconds (30–300, default 60)
- `PORT` (default 8787)

## Local Dev

```bash
npm install --prefix server
npm run server
```

## Deploy to Render

- Create a new Web Service pointing to this repo
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `node index.js`
- Add env vars above

## Notes

- The server returns the full OpenAI session JSON, including `client_secret.value` used by the client.
- Keep `APP_AUTH_TOKEN` secret and rotate periodically.


