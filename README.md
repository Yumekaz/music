# 🎵 Reverb — Developer Guide & Documentation

A premium, Spotify-inspired music web application built with a visible YouTube player, direct audio previews, synchronized lyrics, a custom Web Audio API equalizer/visualizer, IndexedDB library persistence, and a progressive web app (PWA) shell.

The project is structured as a two-package npm workspace:
- [`client/`](file:///c:/Users/Mihir/OneDrive/Desktop/music/client): React + Vite frontend styled with Tailwind CSS, using Zustand for state management, TanStack Query for server state caching, and Workbox for PWA service worker caching.
- [`server/`](file:///c:/Users/Mihir/OneDrive/Desktop/music/server): Express.js backend with a modular Provider Adapter architecture, an intelligent track resolving pipeline, and Redis caching.

---

## 🚀 Quick Start

### 1. Installation
Install all workspace dependencies from the root directory:
```bash
npm install
```

### 2. Configuration
Copy the server's example environment configuration:
```bash
cp server/.env.example server/.env
```

To run the app using real APIs, populate the keys in [`server/.env`](file:///c:/Users/Mihir/OneDrive/Desktop/music/server/.env):
```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
YOUTUBE_API_KEY=your_youtube_key
LASTFM_API_KEY=your_lastfm_key
TASTEDIVE_API_KEY=your_tastedive_key
JAMENDO_CLIENT_ID=your_jamendo_id
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```
*Note: If no API keys are provided, the server gracefully runs in **Fallback Mode** using deterministic seeded fixtures so all searches, playback, lyrics, provider badges, and playlists remain fully testable end-to-end.*

### 3. Running Locally
Start both the React client and Express server concurrently:
```bash
npm run dev
```
- **Client**: `http://localhost:5173`
- **Server**: `http://localhost:5000`

### 4. Verification
Run workspace-wide unit and integration tests (Vitest) or run a production build:
```bash
# Run all tests
npm test

# Build client and server packages
npm run build
```

---

## 🛠️ Architecture Deep-Dive

### 1. Playback Engine & Compliance (YouTube ToS)
To comply with the YouTube API Terms of Service, the application implements a strict **visible playback paradigm**:
- **Source Tier 1: YouTube Embed (Primary Streaming)**: A visible, styled YouTube iframe player (minimum `200x200px`) is mounted in the DOM. When the user navigates away from the Now Playing view, the embed automatically transitions into a floating mini-player at the bottom right/left corner, preserving the iframe mount lifecycle and avoiding playback interruptions.
- **Source Tier 2: iTunes Previews (Quick Previewing)**: Fetches 30-second `.m4p` direct audio URLs from the iTunes Search API. Playback is routed through a native HTML5 `<audio>` element.
- **Source Tier 3: Jamendo CC streams (Full Streaming)**: Integrates CC-licensed indie catalog audio streams via the Jamendo API into the `<audio>` element.

### 2. Audio Processing Graph (Equalizer, Visualizer, Crossfade)
The client controls direct audio sources (iTunes & Jamendo) using the browser's **Web Audio API**:
- **8-Band Equalizer**: Connects a chain of `BiquadFilterNode` elements directly to the `<audio>` element source.
  - **Frequencies & Types**: Sub-Bass (`60Hz` lowshelf), Bass (`170Hz` peaking), Low-Mid (`310Hz` peaking), Mid (`600Hz` peaking), High-Mid (`1kHz` peaking), Presence (`3kHz` peaking), Brilliance (`6kHz` peaking), Air (`12kHz` highshelf).
  - **Presets**: `Normal`, `Bass Boost`, `Pop`, `Rock`, `Jazz`, `Electronic`, `Vocal`, `Custom`.
  - *Note: The equalizer displays a notification explaining it only applies to direct previews and Jamendo tracks, since browsers block cross-origin audio capture on the YouTube iframe.*
- **Audio Frequency Visualizer**: Uses an `AnalyserNode` (`fftSize = 256`) to query real-time frequency data and draw an animated gradient bar chart using a high-density Canvas overlay.
- **Crossfader**: Applies a smooth transition crossfade (fade out current -> swap source -> fade in) between preview tracks using a step-interval volume sweep.

### 3. Offline & Local Storage Strategy
- **Service Worker (Workbox)**: Configured inside Vite PWA (`vite.config.js`) to handle asset and request routing:
  - **Static App Shell**: HTML, JS, CSS, and icons cached using a **Cache-First** strategy.
  - **Album Artwork**: Remote cover art images cached via **Stale-While-Revalidate** (max 80 entries, 7-day TTL).
  - **Metadata & Lyrics**: API responses cached via a **Network-First** policy falling back to local cache when offline (max 120 entries, 24-hour TTL).
- **IndexedDB (`idb`) Database Schemas**: Persistent offline browser tables handle:
  - `likedTracks`: Tracks tagged by the user.
  - `history`: Played history stored in reverse chronological order.
  - `playlists`: Locally created folders holding user track selections.
  - `downloads`: Full offline audio cache. The app fetches Jamendo or iTunes preview audio streams, converts them to `Blob` storage, and stores them in IndexedDB to allow complete playback offline.

### 4. Intelligent Resolver & Candidate Ranking
When searching for or loading a track, the server runs a unified resolver pipeline. Given a `title` and `artist`, it triggers parallel provider queries and scores resulting candidates:
- **Weights for Candidate Selection**:
  - MusicBrainz ID (MBID) confirmation: `+35` points
  - Exact Title match: `+30` points
  - Substring Title match: `+12` points
  - Artist name match: `+24` points
  - Album name match: `+12` points
  - Duration match within 5 seconds: `+20` points
  - Duration match within 15 seconds: `+10` points
  - iTunes Preview URL / YouTube Video ID presence: `+8` points each
  - Popularity / View count scaling factor: up to `+10` points
- The candidate with the highest score is normalized, fetched for lyrics availability via LRCLIB, and decorated with external deep-links (Spotify, Apple Music, YouTube, JioSaavn, Deezer) fetched via the Odesli API.

---

## 📂 Project Structure

```
music/
├── client/                     # Frontend Application
│   ├── public/                 # Static icons, logos, and manifest
│   ├── src/
│   │   ├── app/                # Global routing & providers wrappers
│   │   ├── components/         # Modular React views
│   │   │   ├── album/          # Album display cards
│   │   │   ├── artist/         # Artist info layout components
│   │   │   ├── common/         # Toast, skeleton, error boundary widgets
│   │   │   ├── equalizer/      # Equalizer presets and sliders
│   │   │   ├── layout/         # App shell, sidebar, mobile navigation
│   │   │   ├── lyrics/         # Synced scrolling lyrics container
│   │   │   ├── player/         # Bottom bar, volume, queue, and visualizer
│   │   │   └── search/         # Search bar and autocomplete inputs
│   │   ├── hooks/              # Custom triggers (media keys, online status, EQ, shortcuts)
│   │   ├── lib/                # IndexedDB wrappers, direct audio helpers
│   │   ├── pages/              # Main routes (Home, Search, Library, Settings, etc.)
│   │   ├── services/           # Axios-like fetch wrappers connecting client to backend
│   │   ├── store/              # Zustand global client states (player, library, settings)
│   │   └── styles.css          # Vanilla CSS customized dark visual theme
│   ├── package.json
│   └── vite.config.js          # Vite config, dev proxy, Vitest runner, and VitePWA/Workbox
│
├── server/                     # Backend API
│   ├── src/
│   │   ├── config/             # Configuration parsers and env validators
│   │   ├── data/               # Pre-seeded fallback database fixtures
│   │   ├── middleware/         # Caching wrappers and input validators
│   │   ├── routes/             # Route declarations (search, track, artist, album, discovery)
│   │   ├── services/           # Business logic: resolver service & provider integrations
│   │   │   └── providers/      # Adapters (YT, JioSaavn, Last.fm, MusicBrainz, LRCLIB, etc.)
│   │   ├── utils/              # Redis client, scoring ranker, logging configurations
│   │   └── index.js            # Server entrypoint
│   └── package.json
└── README.md                   # Project documentation
```

---

## 🔌 API Routes

All endpoints are hosted under the `/api` prefix on the server:

| Endpoint | Method | Purpose | Redis TTL |
|---|---|---|---|
| `/api/health` | `GET` | Health status & active provider verification | None |
| `/api/search?q=...` | `GET` | Main search endpoint for tracks, artists, and albums | YT: 1 hr |
| `/api/tracks/resolve` | `GET` | Evaluates, resolves, and ranks track candidates | 1 hour |
| `/api/tracks/:id` | `GET` | Fetches normalized metadata for a specific track | 7 days |
| `/api/tracks/:id/lyrics` | `GET` | Fetches plain or synchronized lyrics via LRCLIB | 7 days |
| `/api/tracks/:id/availability`| `GET` | Returns Songlink/Odesli platform links | 24 hours |
| `/api/artists/:id` | `GET` | Retrieves artist bio, tags, and top songs | 24 hours |
| `/api/artists/:id/similar` | `GET` | Returns similar artists from Last.fm + TasteDive | 24 hours |
| `/api/albums/:id` | `GET` | Returns album tracklists and details from MusicBrainz | 7 days |
| `/api/discovery/trending` | `GET` | Trending music list from YouTube API (Region: IN) | 30 minutes |
| `/api/discovery/charts` | `GET` | Last.fm Global charts | 24 hours |

---

## ⌨️ Keyboard Shortcuts

Pressing `/?` anywhere in the app displays the keyboard shortcut reference panel:

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `ArrowRight` | Seek forward 5 seconds |
| `ArrowLeft` | Seek backward 5 seconds |
| `ArrowUp` | Increase volume by 10% |
| `ArrowDown` | Decrease volume by 10% |
| `N` | Skip to next track in queue |
| `P` | Play previous track in queue |
| `S` | Toggle Shuffle mode |
| `R` | Cycle Repeat mode (Off / Repeat All / Repeat One) |
| `L` | Toggle like status on current track |
| `/` | Toggle shortcuts help guide |
