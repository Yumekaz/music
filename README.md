# Music App V3

A Spotify-inspired music web app with a visible YouTube player, direct audio previews, lyrics, library persistence, and a PWA shell.

The app is built as a two-package workspace:

- `client/`: React, Vite, Tailwind, Zustand, TanStack Query, IndexedDB, PWA.
- `server/`: Express API, provider adapters, resolver, ranking, cache, seeded fallback data.

## Local Run

```bash
npm install
npm run dev
```

Client: `http://localhost:5173`

Server: `http://localhost:5000`

The app works without API keys. When provider keys are absent, the server uses deterministic seeded data so search, playback, lyrics, provider links, and library flows remain testable end to end.

## Environment

Copy `server/.env.example` to `server/.env` when you are ready to use real providers.

```env
YOUTUBE_API_KEY=
LASTFM_API_KEY=
TASTEDIVE_API_KEY=
JAMENDO_CLIENT_ID=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

## Verification

```bash
npm test
npm run build
```

## Deployment Config

- `client/vercel.json` is ready for Vercel.
- `render.yaml` is ready for a Render web service running the Express backend.

No deployment is performed automatically.
