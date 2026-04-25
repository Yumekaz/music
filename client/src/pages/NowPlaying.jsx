import { ExternalLink } from "lucide-react";
import { Equalizer } from "../components/equalizer/Equalizer.jsx";
import { ImageWithFallback } from "../components/common/ImageWithFallback.jsx";
import { LyricsPanel } from "../components/lyrics/LyricsPanel.jsx";
import { ProviderBadge } from "../components/common/ProviderBadge.jsx";
import { useDirectAudio } from "../hooks/useDirectAudio.js";
import { isDirectAudioSource } from "../lib/resolvers.js";
import { usePlayerStore } from "../store/playerStore.js";

export default function NowPlaying() {
  const {
    currentTrack,
    sourceType,
    isPlaying,
    positionMs,
    volume,
    setPosition,
    setDuration,
    next
  } = usePlayerStore();
  const directEnabled = isDirectAudioSource(sourceType);
  const mirrorAudioRef = useDirectAudio({
    track: null,
    sourceType: "preview",
    isPlaying: false,
    volume,
    onTimeUpdate: (position, duration) => {
      setPosition(position);
      setDuration(duration);
    },
    onEnded: next
  });

  if (!currentTrack) {
    return (
      <div className="empty-page">
        <h1>Nothing playing</h1>
        <p>Start a track from Home or Search.</p>
      </div>
    );
  }

  return (
    <div className="now-playing-page">
      <section className="now-media">
        <ImageWithFallback src={currentTrack.artworkUrl} alt={currentTrack.title} className="large-artwork" />
      </section>
      <section className="now-details">
        <p>{sourceType === "youtube" ? "YouTube playback" : "Direct audio preview"}</p>
        <h1>{currentTrack.title}</h1>
        <h2>{currentTrack.artistName}</h2>
        <div className="provider-list">
          {Object.entries(currentTrack.externalLinks || {}).map(([provider, href]) => (
            <ProviderBadge key={provider} provider={provider} href={href} />
          ))}
        </div>
        <a className="utility-link" href={currentTrack.externalLinks?.youtube} target="_blank" rel="noreferrer">
          <ExternalLink size={16} aria-hidden="true" />
          <span>Open source</span>
        </a>
        <Equalizer audioRef={mirrorAudioRef} enabled={directEnabled} />
      </section>
      <LyricsPanel trackId={currentTrack.id} positionMs={positionMs} />
    </div>
  );
}
