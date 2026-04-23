# 🎵 Music App V3 — Final Honest Spec

## What We're Building

A Spotify-like music web app that:
- Searches any song (latest + old, Bollywood + global)
- Plays music via a visible YouTube embed styled into the UI
- Shows rich artist pages, album pages, recommendations
- Shows synced lyrics
- Has an equalizer (for direct audio sources)
- Caches metadata, artwork, lyrics offline via Service Worker
- Is installable as a PWA
- Costs ₹0 personally

---

## What Changed from V2 and Why

### Hidden 0x0 YouTube player — REMOVED
YouTube's own IFrame API ToS requires embedded players to be **at least 200×200 pixels**. A 0x0 hidden player violates this. We use a visible player instead, styled into the Now Playing page UI.

### Web Audio API equalizer on YouTube — REMOVED
Browser same-origin policy blocks JavaScript from accessing the DOM inside a cross-origin iframe. `createMediaElementSource()` cannot reach YouTube's internal audio element. Equalizer now applies only to direct audio sources where we control the `<audio>` element.

### Service Worker caching YouTube audio — REMOVED
Your Service Worker controls your origin only. It cannot intercept network requests made by YouTube's iframe from youtube.com. So "cache YouTube audio for offline" was never going to work. Offline now caches metadata, artwork, and lyrics only.

### JioSaavn as backbone — DOWNGRADED to enrichment only
The community-maintained saavn.dev is unofficial and fragile. We use it as a bonus layer for Indian metadata enrichment, not as a core dependency.

### Everything good — KEPT
Resolver service, ranking logic, LRCLIB lyrics, Last.fm, MusicBrainz, Cover Art Archive, TheAudioDB, TasteDive, Odesli, playlists, history, PWA shell, provider deep-links.

---

## Tech Stack

### Frontend
- **React + Vite**
- **Tailwind CSS** (dark Spotify-inspired theme)
- **Zustand** (player, queue, library state)
- **TanStack Query** (server state, caching, background refetch)
- **React Router v6**
- **Web Audio API** (equalizer — direct audio sources only)
- **idb** (IndexedDB for playlists, history, liked tracks)
- **Workbox** (Service Worker, PWA, metadata/asset caching)

### Backend
- **Node.js + Express**
- **Upstash Redis** (API response caching)
- **dotenv** (API key management)
- Provider adapter pattern — each API is its own isolated module

### Deployment
- **Vercel** — Frontend (free)
- **Render** — Backend (free)
- **Upstash** — Redis (free tier)

---

## API Stack

| Purpose | API | Auth | Cost |
|---|---|---|---|
| Search + video IDs | YouTube Data API v3 | API Key | Free (10k units/day) |
| Playback | YouTube IFrame API | None (embed) | Free |
| Indian music enrichment | JioSaavn (saavn.dev) | None | Free, unofficial |
| Artist info + recommendations | Last.fm | API Key | Free, unlimited |
| Synced lyrics | LRCLIB | None | Free, unlimited |
| Music metadata | MusicBrainz | None | Free, unlimited |
| Album art | Cover Art Archive | None | Free, unlimited |
| Artist images | TheAudioDB | None (key: "2", dev tier) | Free, low rate limit |
| Similar artists | TasteDive | API Key | Free, 300 req/hr |
| Provider availability | Odesli / Songlink | None | Free |
| 30s audio previews (direct) | iTunes Search API | None | Free, unlimited |
| Legal full streaming | Jamendo | OAuth | Free |

### API Keys Needed
- **YouTube Data API v3**: console.cloud.google.com
- **Last.fm**: last.fm/api/account/create
- **TasteDive**: tastedive.com/api
- **Jamendo**: developer.jamendo.com
- **Upstash Redis**: upstash.com

### No Key Needed
JioSaavn (saavn.dev), MusicBrainz, Cover Art Archive, LRCLIB, Odesli, TheAudioDB (dev key "2"), iTunes Search

---

## Playback Architecture (Honest Version)

### Source Tier 1 — YouTube (Main catalog)
A visible YouTube IFrame player, minimum 200×200, embedded into the Now Playing page. Styled to look native — no YouTube chrome visible, just the video/audio area.

The player stays on the Now Playing page. When the user navigates away, the player persists via a floating mini-player component that keeps the iframe mounted in the DOM.

**No hidden 0x0 trick. No audio capture. No ad blocking. Respects YouTube ToS.**

### Source Tier 2 — iTunes 30s Previews (Quick previews)
For songs where the user just wants a quick preview without going to Now Playing, iTunes Search API provides a direct `.m4p` audio preview URL. This is a real `<audio>` element we control — equalizer works here.

### Source Tier 3 — Jamendo (Full legal streaming)
For Jamendo catalog tracks, we get a direct audio stream URL. This is a real `<audio>` element — equalizer works here. Good for indie/CC music discovery.

### Equalizer — Applies to Tier 2 and Tier 3 only
Web Audio API equalizer using BiquadFilterNode chain. Works when we have a real `<audio>` element (iTunes preview or Jamendo stream). Does not apply to YouTube IFrame since cross-origin audio capture is blocked by the browser.

---

## YouTube Player — Implementation Details

### Player Requirements (YouTube ToS compliant)
- Minimum size: 200×200 pixels at all times
- Player must be visible when playing
- Cannot block or modify YouTube player controls
- Cannot strip ads
- Cannot play in a hidden background context

### Implementation
The YouTube IFrame is rendered inside the Now Playing page as a styled component. When the user minimizes to the mini-player bar, a small (200×200) YouTube embed stays visible in a corner or within the mini-player itself.

```
Now Playing page:
  → YouTube embed styled large (fills artwork area)
  → Video quality set to highest available
  → YouTube controls hidden via playerVars

Mini-player mode (user navigates away):
  → Compact player bar at bottom
  → 200×200 YouTube iframe visible (styled as thumbnail)
  → Standard playback controls alongside it
```

### YouTube IFrame playerVars
```javascript
{
  autoplay: 1,
  controls: 0,        // hide YouTube controls (our own controls show)
  disablekb: 1,
  fs: 0,
  modestbranding: 1,
  rel: 0,
  iv_load_policy: 3
}
```

---

## Equalizer (Honest Scope)

### Works On
- iTunes 30-second previews (direct `<audio>` element)
- Jamendo full streams (direct `<audio>` element)

### Does Not Work On
- YouTube IFrame (cross-origin iframe, browser blocks audio capture)

### UI Behavior
- Show equalizer in player controls always
- When YouTube is active: show equalizer UI but display note "EQ applies to preview and Jamendo tracks"
- When iTunes preview or Jamendo is active: equalizer fully functional

### 8-Band Chain (Web Audio API)
| Band | Frequency | Filter Type |
|---|---|---|
| Sub Bass | 60 Hz | lowshelf |
| Bass | 170 Hz | peaking |
| Low Mid | 310 Hz | peaking |
| Mid | 600 Hz | peaking |
| High Mid | 1 kHz | peaking |
| Presence | 3 kHz | peaking |
| Brilliance | 6 kHz | peaking |
| Air | 12 kHz | highshelf |

### Presets
- Normal, Bass Boost, Pop, Rock, Jazz, Electronic, Vocal, Custom

---

## Offline Strategy (Honest Scope)

### What Gets Cached (Service Worker via Workbox)
- App shell (HTML, JS, CSS, icons) → Cache First
- Artwork images → Stale While Revalidate
- API metadata responses → Network First with fallback
- LRCLIB lyrics → Cache First (7 day TTL)
- User playlists → IndexedDB (always available)
- Listening history → IndexedDB
- Liked tracks → IndexedDB

### What Does NOT Get Cached
- YouTube audio (SW cannot intercept cross-origin iframe requests)
- Jamendo streams (too large, licensing unclear for offline)
- iTunes previews (short, not worth caching)

### Offline UX
When user is offline:
- App shell loads instantly (cached)
- Playlists, history, liked tracks all visible (IndexedDB)
- Artwork shows from cache
- Lyrics show from cache
- Play button disabled with message: "Connect to internet to play"
- Provider deep-links visible so user can open in another app

---

## Resolver Service (Core Backend Intelligence)

Given: `title + artist name`

Steps:
1. YouTube Data API search → get videoId + duration
2. MusicBrainz search → get MBID, canonical release info
3. Cover Art Archive → get album artwork via MBID
4. Last.fm → get artist bio, tags, similar tracks
5. LRCLIB → check lyrics availability
6. Odesli → get all platform deep-links
7. JioSaavn (saavn.dev) → bonus Indian metadata if found
8. iTunes Search → get 30s preview URL if available
9. Return one NormalizedTrack

### Ranking Logic
When sources return conflicting results, rank by:
1. MBID-backed match (strongest signal)
2. Exact title + artist string match
3. Album / release confirmation
4. Duration similarity (within 5 seconds = strong match)
5. iTunes duration confirmation
6. YouTube view count (popularity signal)

---

## Data Models

### NormalizedTrack
```javascript
{
  id: string,
  videoId: string,               // YouTube (primary playback)
  previewUrl: string,            // iTunes 30s preview (direct audio)
  jamendoId: string,             // Jamendo stream if available
  title: string,
  artistName: string,
  artistId: string,
  albumName: string,
  albumId: string,
  durationMs: number,
  artworkUrl: string,
  mbid: string,
  lyricsAvailable: boolean,
  availableProviders: string[],
  externalLinks: {
    spotify: string,
    apple: string,
    youtube: string,
    jiosaavn: string,
    deezer: string
  }
}
```

### NormalizedArtist
```javascript
{
  id: string,
  name: string,
  imageUrl: string,
  bio: string,
  tags: string[],
  similarArtists: Artist[],
  topTracks: Track[],
  mbid: string,
  providerLinks: {}
}
```

---

## Project Folder Structure

```
music-app/
├── client/
│   ├── public/
│   │   ├── manifest.json
│   │   └── icons/
│   ├── src/
│   │   ├── app/
│   │   │   ├── router.jsx
│   │   │   └── providers.jsx
│   │   ├── components/
│   │   │   ├── player/
│   │   │   │   ├── Player.jsx              # Bottom mini-player bar
│   │   │   │   ├── PlayerControls.jsx
│   │   │   │   ├── ProgressBar.jsx
│   │   │   │   ├── VolumeControl.jsx
│   │   │   │   └── YouTubeEmbed.jsx        # Visible iframe, min 200x200
│   │   │   ├── equalizer/
│   │   │   │   ├── Equalizer.jsx
│   │   │   │   └── EqualizerPresets.js
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   └── SearchResults.jsx
│   │   │   ├── track/
│   │   │   │   ├── TrackCard.jsx
│   │   │   │   └── TrackRow.jsx
│   │   │   ├── artist/
│   │   │   │   └── ArtistCard.jsx
│   │   │   ├── album/
│   │   │   │   └── AlbumCard.jsx
│   │   │   ├── lyrics/
│   │   │   │   └── LyricsPanel.jsx
│   │   │   ├── sidebar/
│   │   │   │   └── Sidebar.jsx
│   │   │   └── common/
│   │   │       ├── ProviderBadge.jsx
│   │   │       ├── ImageWithFallback.jsx
│   │   │       └── LoadingSkeleton.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── Track.jsx
│   │   │   ├── Artist.jsx
│   │   │   ├── Album.jsx
│   │   │   ├── Playlist.jsx
│   │   │   ├── NowPlaying.jsx          # YouTube embed lives here (large)
│   │   │   └── Library.jsx
│   │   ├── store/
│   │   │   ├── playerStore.js
│   │   │   ├── queueStore.js
│   │   │   ├── libraryStore.js
│   │   │   └── settingsStore.js
│   │   ├── hooks/
│   │   │   ├── useYouTubePlayer.js
│   │   │   ├── useDirectAudio.js       # For iTunes preview + Jamendo
│   │   │   ├── useEqualizer.js         # Attaches to direct audio only
│   │   │   ├── useSearch.js
│   │   │   ├── useLyrics.js
│   │   │   └── usePWAInstall.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── search.js
│   │   │   ├── tracks.js
│   │   │   ├── artists.js
│   │   │   ├── albums.js
│   │   │   └── lyrics.js
│   │   ├── lib/
│   │   │   ├── idb.js
│   │   │   ├── formatters.js
│   │   │   └── resolvers.js
│   │   ├── sw.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── search.routes.js
│   │   │   ├── tracks.routes.js
│   │   │   ├── artists.routes.js
│   │   │   ├── albums.routes.js
│   │   │   ├── lyrics.routes.js
│   │   │   └── providers.routes.js
│   │   ├── services/
│   │   │   ├── resolver.service.js
│   │   │   ├── search.service.js
│   │   │   ├── lyrics.service.js
│   │   │   ├── availability.service.js
│   │   │   └── providers/
│   │   │       ├── youtube.provider.js
│   │   │       ├── jiosaavn.provider.js
│   │   │       ├── lastfm.provider.js
│   │   │       ├── musicbrainz.provider.js
│   │   │       ├── coverart.provider.js
│   │   │       ├── lrclib.provider.js
│   │   │       ├── theaudiodb.provider.js
│   │   │       ├── tastedive.provider.js
│   │   │       ├── odesli.provider.js
│   │   │       ├── itunes.provider.js
│   │   │       └── jamendo.provider.js
│   │   ├── middleware/
│   │   │   ├── cache.js
│   │   │   ├── rateLimit.js
│   │   │   └── validate.js
│   │   ├── utils/
│   │   │   ├── redis.js
│   │   │   ├── logger.js
│   │   │   └── ranking.js
│   │   └── index.js
│   └── package.json
└── README.md
```

---

## Backend Routes

```
GET  /api/search?q=              Search tracks, artists, albums
GET  /api/tracks/resolve         Full resolver pipeline
GET  /api/tracks/:id             Cached normalized track
GET  /api/tracks/:id/lyrics      LRCLIB synced + plain fallback
GET  /api/tracks/:id/availability Odesli provider links
GET  /api/artists/:id            Normalized artist profile
GET  /api/artists/:id/similar    Last.fm + TasteDive similar artists
GET  /api/artists/:id/top-tracks Last.fm top tracks
GET  /api/albums/:id             MusicBrainz + Cover Art Archive
GET  /api/discovery/trending     YouTube trending music (region: IN)
GET  /api/discovery/charts       Last.fm top charts
```

---

## Pages

### Home
- Trending (YouTube, region IN)
- New releases (Last.fm charts)
- Genre rows
- Recently played (IndexedDB)
- Continue listening

### Search
- Debounced 300ms
- Grouped results: Tracks / Artists / Albums
- Each track: artwork, title, artist, duration, play button, 30s preview button

### Now Playing
- Large visible YouTube embed (fills the artwork area, styled)
- Song title, artist, album
- Progress bar (YouTube API provides currentTime)
- Synced lyrics panel (LRCLIB, scrolls with playback)
- Queue panel toggle
- Provider deep-links (Odesli)
- Equalizer access (shows note if YouTube active)

### Mini-Player (persistent, all pages)
- Bottom bar
- 200×200 YouTube embed visible (ToS compliant)
- Title, artist
- Play/pause, next, previous
- Progress bar
- Click anywhere → expands to Now Playing

### Artist
- Banner (TheAudioDB or Last.fm image)
- Bio (Last.fm)
- Tags
- Top tracks (playable)
- Discography (MusicBrainz)
- Similar artists (Last.fm + TasteDive)

### Album
- Artwork (Cover Art Archive)
- Track list
- Release date, artist link

### Library
- Liked tracks
- User playlists
- Listening history

---

## Redis Cache TTLs

| Data | TTL |
|---|---|
| YouTube search results | 1 hour |
| YouTube trending | 30 minutes |
| MusicBrainz metadata | 7 days |
| Last.fm artist info | 24 hours |
| Last.fm similar tracks | 6 hours |
| Cover Art Archive | 7 days |
| TheAudioDB images | 7 days |
| LRCLIB lyrics | 7 days |
| Odesli availability | 24 hours |
| TasteDive similar | 24 hours |
| iTunes preview URLs | 6 hours |
| JioSaavn enrichment | 6 hours |

---

## Environment Variables

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

---

## Free Tier Summary

| Service | Limit | OK for personal? |
|---|---|---|
| Vercel | 100GB/month | ✅ |
| Render | 750hrs/month | ✅ |
| Upstash Redis | 10k req/day | ✅ |
| YouTube Data API | 10k units/day | ✅ |
| Last.fm | Unlimited | ✅ |
| MusicBrainz | Unlimited | ✅ |
| LRCLIB | Unlimited | ✅ |
| Cover Art Archive | Unlimited | ✅ |
| Odesli | Unlimited | ✅ |
| iTunes Search | Unlimited | ✅ |
| TasteDive | 300 req/hr | ✅ |
| TheAudioDB | Dev tier (low limit) | ✅ personal |
| JioSaavn (saavn.dev) | Unofficial, fragile | ⚠️ bonus only |
| Jamendo | Free tier | ✅ |

**Total cost: ₹0**

---

## Build Order for Claude Code

### Step 1 — Backend
- Express + Redis setup
- All provider modules
- Resolver service + ranking logic
- All routes

### Step 2 — Frontend Foundation
- Vite + React + Tailwind
- Routing + Zustand stores
- TanStack Query setup
- Axios api.js → backend

### Step 3 — Core UI
- Sidebar, Home, Search pages
- Track / Artist / Album cards
- Loading skeletons

### Step 4 — Player
- YouTube IFrame component (visible, min 200x200)
- useYouTubePlayer hook (load, play, pause, seek, onEnd)
- Mini-player bar (persistent bottom bar with visible embed)
- Queue management

### Step 5 — Pages
- Artist, Album, Track, Now Playing, Library, Playlist pages

### Step 6 — Features
- Lyrics (LRCLIB synced, scrolls with playback)
- Direct audio player (iTunes preview + Jamendo via HTML audio element)
- Equalizer (Web Audio API on direct audio only)
- Provider badges + Odesli deep-links
- IndexedDB (playlists, history, liked)

### Step 7 — PWA + Offline
- manifest.json + icons
- Workbox Service Worker (app shell + metadata + images + lyrics caching)
- SW registers in production only
- Offline UI states

### Step 8 — Polish
- Error states for every failure case
- Responsive mobile layout
- Keyboard shortcuts
- Performance: lazy load pages, virtualize long lists

---

## Implementation Notes for Claude Code

- YouTube IFrame must be **visible at all times when playing** — minimum 200×200 per YouTube ToS
- Keep the YouTube IFrame mounted in the DOM across page navigation using a persistent layout component, not unmounting/remounting on route change
- Use `playerVars: { controls: 0, modestbranding: 1, rel: 0 }` on YouTube IFrame
- Equalizer uses Web Audio API BiquadFilterNode chain connected to a real HTML `<audio>` element — iTunes preview URL or Jamendo stream URL only
- Do NOT attempt `createMediaElementSource()` on the YouTube iframe — cross-origin policy blocks it
- Service Worker (Workbox) caches: app shell, images, API JSON responses, lyrics — NOT YouTube audio
- Use `idb` npm package for IndexedDB operations
- MusicBrainz requires User-Agent header: `MusicApp/1.0.0 (contact@youremail.com)`
- TheAudioDB free key is `"2"` — use it, but cache aggressively and expect low rate limits
- JioSaavn base URL: `https://saavn.dev/api` — treat as enrichment only, gracefully skip if it fails
- LRCLIB base URL: `https://lrclib.net/api`
- Odesli base URL: `https://api.song.link/v1-alpha.1/links`
- iTunes Search base URL: `https://itunes.apple.com/search?term=`
- Debounce search input 300ms minimum
- TanStack Query handles all loading/error/cache states — don't duplicate this logic manually
- react-beautiful-dnd for playlist and queue drag-and-drop
- Auto-advance queue on YouTube `onStateChange` event where state === 0 (ended)
- Vite PWA plugin handles Service Worker generation cleanly with Workbox
- All API keys stay server-side — frontend never calls external APIs directly
