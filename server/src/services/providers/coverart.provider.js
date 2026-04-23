import { safeFetchJson } from "../../utils/fetchJson.js";

export async function getCoverArt(releaseMbid) {
  if (!releaseMbid) return "";

  const data = await safeFetchJson(`https://coverartarchive.org/release/${releaseMbid}`);
  const image = data?.images?.find((item) => item.front) || data?.images?.[0];
  return image?.thumbnails?.large || image?.image || "";
}
