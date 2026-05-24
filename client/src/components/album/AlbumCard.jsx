import { Link } from "react-router-dom";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";

export function AlbumCard({ album }) {
  const entityTileClass = "grid gap-[10px] min-w-0 group cursor-pointer";
  const entityImageClass = "w-full aspect-square rounded-[8px] object-cover bg-[#101510]";
  const titleClass = "overflow-hidden whitespace-nowrap text-ellipsis text-ink group-hover:underline text-[0.85rem] font-medium";
  const artistClass = "text-[0.75rem] text-muted overflow-hidden whitespace-nowrap text-ellipsis";

  return (
    <Link to={`/albums/${album.id}`} className={entityTileClass}>
      <ImageWithFallback src={album.artworkUrl} alt={album.title} className={entityImageClass} />
      <span className={titleClass}>{album.title}</span>
      <small className={artistClass}>{album.artistName}</small>
    </Link>
  );
}
