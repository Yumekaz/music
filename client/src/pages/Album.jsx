import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { ImageWithFallback } from "../components/common/ImageWithFallback.jsx";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton.jsx";
import { TrackRow } from "../components/track/TrackRow.jsx";
import { getAlbum } from "../services/albums.js";

export default function Album() {
  const { id } = useParams();
  const album = useQuery({ queryKey: ["album", id], queryFn: () => getAlbum(id), enabled: Boolean(id) });

  if (album.isLoading) return <LoadingSkeleton label="Loading album" />;
  if (!album.data) return <p className="text-muted m-0 p-[24px]">Album not found.</p>;

  const pageStackClass = "grid gap-[28px] md:flex md:flex-col md:gap-[32px] md:max-w-[1920px] md:mx-auto";
  const albumHeaderClass = "grid grid-cols-1 md:grid-cols-[minmax(220px,340px)_minmax(0,1fr)] gap-[28px] items-end pb-[16px] md:pb-[24px] border-b border-line p-[16px] md:p-0";
  const albumArtLargeClass = "w-full aspect-square rounded-[8px] object-cover bg-[#101510]";
  const headerInfoClass = "min-w-0";
  const headerLabelClass = "uppercase text-[0.78rem] font-bold text-ink m-0 mb-[8px]";
  const headerTitleClass = "text-[clamp(2.5rem,7vw,5.8rem)] leading-[1.1] font-bold m-0 text-ink";
  const headerSubtitleClass = "text-[1.2rem] md:text-[1.5rem] font-semibold text-ink m-0 mt-[8px]";
  const headerMetaClass = "block mt-[8px] text-muted text-[0.9rem]";

  const sectionBlockClass = "grid gap-[16px] px-[16px] md:px-0";
  const sectionHeaderClass = "flex items-center justify-between gap-[16px] min-h-[36px] flex-wrap";
  const trackListClass = "grid gap-[4px]";

  return (
    <div className={pageStackClass}>
      <section className={albumHeaderClass}>
        <ImageWithFallback src={album.data.artworkUrl} alt={album.data.title} className={albumArtLargeClass} />
        <div className={headerInfoClass}>
          <p className={headerLabelClass}>Album</p>
          <h1 className={headerTitleClass}>{album.data.title}</h1>
          <h2 className={headerSubtitleClass}>{album.data.artistName}</h2>
          <span className={headerMetaClass}>{album.data.releaseDate}</span>
        </div>
      </section>
      <section className={sectionBlockClass}>
        <header className={sectionHeaderClass}>
          <h2 className="m-0 text-[1.2rem] font-bold text-ink">Tracks</h2>
        </header>
        <div className={trackListClass}>
          {album.data.tracks?.map((track) => (
            <TrackRow key={track.id} track={track} />
          ))}
        </div>
      </section>
    </div>
  );
}
