import { useQuery } from "@tanstack/react-query";
import { Play, Radio } from "lucide-react";
import { useParams } from "react-router-dom";
import { ImageWithFallback } from "../components/common/ImageWithFallback.jsx";
import { LoadingSkeleton } from "../components/common/LoadingSkeleton.jsx";
import { LyricsPanel } from "../components/lyrics/LyricsPanel.jsx";
import { ProviderBadge } from "../components/common/ProviderBadge.jsx";
import { playDirectAudio } from "../lib/directAudio.js";
import { getTrack } from "../services/tracks.js";
import { usePlayerStore } from "../store/playerStore.js";

export default function Track() {
  const { id } = useParams();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const positionMs = usePlayerStore((state) => state.positionMs);
  const track = useQuery({ queryKey: ["track", id], queryFn: () => getTrack(id), enabled: Boolean(id) });

  if (track.isLoading) return <LoadingSkeleton label="Loading track" />;
  if (!track.data) return <p className="empty-state">Track not found.</p>;

  function startPlayback(sourceType = track.data.previewUrl ? "preview" : "youtube") {
    if (sourceType === "preview" || sourceType === "jamendo") {
      playDirectAudio(track.data, sourceType).catch(() => {});
    }
    playTrack(track.data, sourceType);
  }

  return (
    <div className="page-stack">
      <section className="album-header">
        <ImageWithFallback src={track.data.artworkUrl} alt={track.data.title} className="album-art-large" />
        <div>
          <p>Track</p>
          <h1>{track.data.title}</h1>
          <h2>{track.data.artistName}</h2>
          <div className="hero-actions">
            <button type="button" className="primary-action" onClick={() => startPlayback()}>
              <Play size={18} aria-hidden="true" />
              <span>Play</span>
            </button>
            <button type="button" className="utility-button" onClick={() => startPlayback("preview")} disabled={!track.data.previewUrl}>
              <Radio size={16} aria-hidden="true" />
              <span>Preview</span>
            </button>
          </div>
          <div className="provider-list">
            {Object.entries(track.data.externalLinks || {}).map(([provider, href]) => (
              <ProviderBadge key={provider} provider={provider} href={href} />
            ))}
          </div>
        </div>
      </section>
      <LyricsPanel trackId={track.data.id} positionMs={positionMs} />
    </div>
  );
}
