import { safeFetchJson } from "../../utils/fetchJson.js";

export async function getAudioDbArtist(name) {
  const params = new URLSearchParams({ s: name });
  const data = await safeFetchJson(`https://www.theaudiodb.com/api/v1/json/2/search.php?${params}`);
  const artist = data?.artists?.[0];
  if (!artist) return null;

  return {
    imageUrl: artist.strArtistThumb || artist.strArtistFanart || "",
    bio: artist.strBiographyEN || "",
    providerLinks: {
      theaudiodb: `https://www.theaudiodb.com/artist/${artist.idArtist}`
    }
  };
}
