import { useQuery } from "@tanstack/react-query";
import { getLyrics } from "../services/lyrics.js";

export function useLyrics(trackId) {
  return useQuery({
    queryKey: ["lyrics", trackId],
    queryFn: () => getLyrics(trackId),
    enabled: Boolean(trackId),
    staleTime: 7 * 24 * 60 * 60 * 1000
  });
}
