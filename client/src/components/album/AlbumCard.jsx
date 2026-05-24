import { Link } from "react-router-dom";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";

export function AlbumCard({ album }) {
  return (
    <Link to={`/albums/${album.id}`} className="entity-tile">
      <ImageWithFallback src={album.artworkUrl} alt={album.title} className="entity-image" />
      <span>{album.title}</span>
      <small>{album.artistName}</small>
    </Link>
  );
}
