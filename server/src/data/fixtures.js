const PREVIEW_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export const artists = [
  {
    id: "artist-weeknd",
    name: "The Weeknd",
    imageUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
    bio: "A nocturnal pop and R&B voice with cinematic synth textures and global chart reach.",
    tags: ["pop", "r&b", "synthwave"],
    mbid: "c8b03190-306c-4120-bb0b-6f2ebfc06ea9",
    providerLinks: {
      youtube: "https://www.youtube.com/results?search_query=The+Weeknd",
      spotify: "https://open.spotify.com/search/The%20Weeknd"
    }
  },
  {
    id: "artist-arijit",
    name: "Arijit Singh",
    imageUrl:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
    bio: "A defining modern Bollywood playback singer known for intimate ballads and sweeping film songs.",
    tags: ["bollywood", "playback", "romantic"],
    mbid: "3a3f86a1-86a5-4fdf-97f3-87a91e9a9b73",
    providerLinks: {
      youtube: "https://www.youtube.com/results?search_query=Arijit+Singh",
      jiosaavn: "https://www.jiosaavn.com/search/arijit%20singh"
    }
  },
  {
    id: "artist-ali-sethi",
    name: "Ali Sethi",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    bio: "A genre-fluid South Asian artist blending classical phrasing, folk memory, and modern pop arrangement.",
    tags: ["indie", "south asian", "fusion"],
    mbid: "fallback-ali-sethi",
    providerLinks: {
      youtube: "https://www.youtube.com/results?search_query=Ali+Sethi",
      spotify: "https://open.spotify.com/search/Ali%20Sethi"
    }
  }
];

export const albums = [
  {
    id: "album-after-hours",
    title: "After Hours",
    artistId: "artist-weeknd",
    artistName: "The Weeknd",
    releaseDate: "2020-03-20",
    artworkUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
    mbid: "fallback-after-hours"
  },
  {
    id: "album-brahmastra",
    title: "Brahmastra",
    artistId: "artist-arijit",
    artistName: "Arijit Singh",
    releaseDate: "2022-10-06",
    artworkUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80",
    mbid: "fallback-brahmastra"
  },
  {
    id: "album-coke-studio",
    title: "Coke Studio Singles",
    artistId: "artist-ali-sethi",
    artistName: "Ali Sethi",
    releaseDate: "2022-02-07",
    artworkUrl:
      "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?auto=format&fit=crop&w=900&q=80",
    mbid: "fallback-coke-studio"
  }
];

export const tracks = [
  {
    id: "track-blinding-lights",
    videoId: "4NRXx6U8ABQ",
    previewUrl: PREVIEW_URL,
    jamendoId: "",
    title: "Blinding Lights",
    artistName: "The Weeknd",
    artistId: "artist-weeknd",
    albumName: "After Hours",
    albumId: "album-after-hours",
    durationMs: 200040,
    artworkUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
    mbid: "fallback-blinding-lights",
    lyricsAvailable: true,
    availableProviders: ["youtube", "spotify", "apple", "itunes"],
    externalLinks: {
      spotify: "https://open.spotify.com/search/Blinding%20Lights%20The%20Weeknd",
      apple: "https://music.apple.com/search?term=Blinding%20Lights%20The%20Weeknd",
      youtube: "https://www.youtube.com/watch?v=4NRXx6U8ABQ",
      jiosaavn: "",
      deezer: "https://www.deezer.com/search/Blinding%20Lights%20The%20Weeknd"
    },
    popularity: 99
  },
  {
    id: "track-kesariya",
    videoId: "BddP6PYo2gs",
    previewUrl: PREVIEW_URL,
    jamendoId: "",
    title: "Kesariya",
    artistName: "Arijit Singh",
    artistId: "artist-arijit",
    albumName: "Brahmastra",
    albumId: "album-brahmastra",
    durationMs: 268000,
    artworkUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80",
    mbid: "fallback-kesariya",
    lyricsAvailable: true,
    availableProviders: ["youtube", "apple", "jiosaavn", "itunes"],
    externalLinks: {
      spotify: "https://open.spotify.com/search/Kesariya%20Arijit%20Singh",
      apple: "https://music.apple.com/search?term=Kesariya%20Arijit%20Singh",
      youtube: "https://www.youtube.com/watch?v=BddP6PYo2gs",
      jiosaavn: "https://www.jiosaavn.com/search/kesariya%20arijit%20singh",
      deezer: "https://www.deezer.com/search/Kesariya%20Arijit%20Singh"
    },
    popularity: 94
  },
  {
    id: "track-pasoori",
    videoId: "5Eqb_-j3FDA",
    previewUrl: PREVIEW_URL,
    jamendoId: "",
    title: "Pasoori",
    artistName: "Ali Sethi",
    artistId: "artist-ali-sethi",
    albumName: "Coke Studio Singles",
    albumId: "album-coke-studio",
    durationMs: 224000,
    artworkUrl:
      "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?auto=format&fit=crop&w=900&q=80",
    mbid: "fallback-pasoori",
    lyricsAvailable: true,
    availableProviders: ["youtube", "spotify", "itunes"],
    externalLinks: {
      spotify: "https://open.spotify.com/search/Pasoori%20Ali%20Sethi",
      apple: "https://music.apple.com/search?term=Pasoori%20Ali%20Sethi",
      youtube: "https://www.youtube.com/watch?v=5Eqb_-j3FDA",
      jiosaavn: "",
      deezer: "https://www.deezer.com/search/Pasoori%20Ali%20Sethi"
    },
    popularity: 96
  }
];

export const lyrics = {
  "track-blinding-lights": {
    source: "fallback-lrclib",
    plain:
      "I said, ooh, I'm blinded by the lights\nNo, I can't sleep until I feel your touch",
    synced: [
      { timeMs: 0, text: "The city is cold and empty" },
      { timeMs: 18000, text: "No one's around to judge me" },
      { timeMs: 42000, text: "I said, ooh, I'm blinded by the lights" },
      { timeMs: 70000, text: "No, I can't sleep until I feel your touch" }
    ]
  },
  "track-kesariya": {
    source: "fallback-lrclib",
    plain:
      "Kesariya tera ishq hai piya\nRang jaaun jo main haath lagaaun",
    synced: [
      { timeMs: 0, text: "Mujhko itna bataaye koi" },
      { timeMs: 23000, text: "Kaise tujhse dil na lagaaye koi" },
      { timeMs: 55000, text: "Kesariya tera ishq hai piya" }
    ]
  },
  "track-pasoori": {
    source: "fallback-lrclib",
    plain:
      "Agg lavaan majboori nu\nAan jaan di pasoori nu",
    synced: [
      { timeMs: 0, text: "Agg lavaan majboori nu" },
      { timeMs: 26000, text: "Aan jaan di pasoori nu" },
      { timeMs: 64000, text: "Zehar bane haan teri" }
    ]
  }
};

export function normalizeTerm(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findTrackById(id) {
  return tracks.find((track) => track.id === id);
}

export function findArtistById(id) {
  return artists.find((artist) => artist.id === id);
}

export function findAlbumById(id) {
  return albums.find((album) => album.id === id);
}

export function searchFixtureTracks(query, limit = 10) {
  const term = normalizeTerm(query);
  if (!term) return tracks.slice(0, limit);

  return tracks
    .filter((track) =>
      normalizeTerm(
        `${track.title} ${track.artistName} ${track.albumName} ${track.availableProviders.join(" ")}`
      ).includes(term)
    )
    .slice(0, limit);
}

export function searchFixtureArtists(query, limit = 10) {
  const term = normalizeTerm(query);
  if (!term) return artists.slice(0, limit);

  return artists
    .filter((artist) => normalizeTerm(`${artist.name} ${artist.tags.join(" ")}`).includes(term))
    .slice(0, limit);
}

export function searchFixtureAlbums(query, limit = 10) {
  const term = normalizeTerm(query);
  if (!term) return albums.slice(0, limit);

  return albums
    .filter((album) => normalizeTerm(`${album.title} ${album.artistName}`).includes(term))
    .slice(0, limit);
}

export function resolveFixtureTrack(title, artistName) {
  const titleTerm = normalizeTerm(title);
  const artistTerm = normalizeTerm(artistName);

  return (
    tracks.find((track) => {
      const titleMatch = normalizeTerm(track.title) === titleTerm;
      const artistMatch = !artistTerm || normalizeTerm(track.artistName).includes(artistTerm);
      return titleMatch && artistMatch;
    }) ||
    searchFixtureTracks(`${title} ${artistName}`, 1)[0] ||
    tracks[0]
  );
}
