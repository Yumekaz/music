import { Link } from "react-router-dom";
import { ImageWithFallback } from "../common/ImageWithFallback.jsx";
import { LoadingSkeleton } from "../common/LoadingSkeleton.jsx";
import { TrackRow } from "../track/TrackRow.jsx";

export function SearchResults({ data, isLoading, query }) {
  if (isLoading) return <LoadingSkeleton label="Searching" />;

  if (!query) {
    return <p className="text-muted m-0 p-[24px]">Search any song, artist, or album.</p>;
  }

  if (!data?.tracks?.length && !data?.artists?.length && !data?.albums?.length) {
    return <p className="text-muted m-0 p-[24px]">No matches yet.</p>;
  }

  const resultsStackClass = "grid gap-[28px] md:flex md:flex-col md:gap-[32px] md:max-w-[1920px] md:mx-auto";
  const sectionBlockClass = "grid gap-[16px] px-[16px] md:px-0";
  const sectionHeaderClass = "flex items-center justify-between gap-[16px] min-h-[36px] flex-wrap";
  const trackListClass = "grid gap-[4px]";
  const entityGridClass = "grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-[14px]";
  const entityTileClass = "grid gap-[10px] min-w-0 group cursor-pointer";
  const entityImageClass = "w-full aspect-square rounded-[8px] object-cover bg-[#101510]";
  const entityTextClass = "overflow-hidden whitespace-nowrap text-ellipsis text-ink group-hover:underline";

  return (
    <div className={resultsStackClass}>
      <section className={sectionBlockClass}>
        <header className={sectionHeaderClass}>
          <h2 className="m-0 text-[1.2rem] font-bold text-ink">Tracks</h2>
        </header>
        <div className={trackListClass}>
          {data.tracks?.map((track) => (
            <TrackRow key={track.id} track={track} />
          ))}
        </div>
      </section>
      <section className={sectionBlockClass}>
        <header className={sectionHeaderClass}>
          <h2 className="m-0 text-[1.2rem] font-bold text-ink">Artists</h2>
        </header>
        <div className={entityGridClass}>
          {data.artists?.map((artist) => (
            <Link to={`/artists/${artist.id}`} key={artist.id} className={entityTileClass}>
              <ImageWithFallback src={artist.imageUrl} alt={artist.name} className={entityImageClass} />
              <span className={entityTextClass}>{artist.name}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className={sectionBlockClass}>
        <header className={sectionHeaderClass}>
          <h2 className="m-0 text-[1.2rem] font-bold text-ink">Albums</h2>
        </header>
        <div className={entityGridClass}>
          {data.albums?.map((album) => (
            <Link to={`/albums/${album.id}`} key={album.id} className={entityTileClass}>
              <ImageWithFallback src={album.artworkUrl} alt={album.title} className={entityImageClass} />
              <span className={entityTextClass}>{album.title}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
