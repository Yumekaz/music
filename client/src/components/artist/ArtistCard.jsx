import { Link } from "react-router-dom";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";

export function ArtistCard({ artist }) {
  return (
    <Link to={`/artists/${artist.id}`} className="entity-tile">
      <ImageWithFallback src={artist.imageUrl} alt={artist.name} className="entity-image" />
      <span>{artist.name}</span>
    </Link>
  );
}
