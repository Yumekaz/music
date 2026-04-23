import { useQuery } from "@tanstack/react-query";
import { searchCatalog } from "../services/search.js";

export function useSearch(query) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchCatalog(query),
    enabled: query.trim().length > 0
  });
}
