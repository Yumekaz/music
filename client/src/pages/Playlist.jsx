import { Link, useParams } from "react-router-dom";

export default function Playlist() {
  const { id } = useParams();

  return (
    <div className="empty-page">
      <h1>Playlist</h1>
      <p>{id} is ready for saved tracks.</p>
      <Link className="primary-action" to="/library">
        Back to library
      </Link>
    </div>
  );
}
