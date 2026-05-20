import { useQuery } from "@tanstack/react-query";
import { getLyrics } from "../services/lyrics.js";

export function useLyrics(trackId, title, artist) {
  return useQuery({
    queryKey: ["lyrics", trackId, title, artist],
    queryFn: () => getLyrics(trackId, title, artist),
    enabled: Boolean(trackId),
    staleTime: 7 * 24 * 60 * 60 * 1000
  });
}
