export function normalizeTrack(track, overrides = {}) {
  return {
    id: track.id,
    videoId: track.videoId || "",
    previewUrl: track.previewUrl || "",
    jamendoId: track.jamendoId || "",
    title: track.title,
    artistName: track.artistName,
    artistId: track.artistId || "",
    albumName: track.albumName || "",
    albumId: track.albumId || "",
    durationMs: Number(track.durationMs || 0),
    artworkUrl: track.artworkUrl || "",
    mbid: track.mbid || "",
    lyricsAvailable: Boolean(track.lyricsAvailable),
    availableProviders: track.availableProviders || [],
    externalLinks: {
      spotify: "",
      apple: "",
      youtube: track.videoId ? `https://www.youtube.com/watch?v=${track.videoId}` : "",
      jiosaavn: "",
      deezer: "",
      ...(track.externalLinks || {})
    },
    ...overrides
  };
}

export function normalizeArtist(artist, overrides = {}) {
  return {
    id: artist.id,
    name: artist.name,
    imageUrl: artist.imageUrl || "",
    bio: artist.bio || "",
    tags: artist.tags || [],
    similarArtists: artist.similarArtists || [],
    topTracks: artist.topTracks || [],
    mbid: artist.mbid || "",
    providerLinks: artist.providerLinks || {},
    ...overrides
  };
}

export function normalizeAlbum(album, overrides = {}) {
  return {
    id: album.id,
    title: album.title,
    artistId: album.artistId || "",
    artistName: album.artistName || "",
    releaseDate: album.releaseDate || "",
    artworkUrl: album.artworkUrl || "",
    mbid: album.mbid || "",
    tracks: album.tracks || [],
    ...overrides
  };
}
