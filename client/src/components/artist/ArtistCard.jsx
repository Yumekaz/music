import { Link } from "react-router-dom";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";

export function ArtistCard({ artist }) {
  const entityTileClass = "grid gap-[10px] min-w-0 group cursor-pointer";
  const entityImageClass = "w-full aspect-square rounded-[8px] object-cover bg-[#101510]";
  const titleClass = "overflow-hidden whitespace-nowrap text-ellipsis text-ink group-hover:underline text-[0.85rem] font-medium";

  return (
    <Link to={`/artists/${artist.id}`} className={entityTileClass}>
      <ImageWithFallback src={artist.imageUrl} alt={artist.name} className={entityImageClass} />
      <span className={titleClass}>{artist.name}</span>
    </Link>
  );
}
