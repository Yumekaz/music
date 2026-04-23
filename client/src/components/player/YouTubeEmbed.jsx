import { useYouTubePlayer } from "../../hooks/useYouTubePlayer.js";

export function YouTubeEmbed({ track, isPlaying, className = "" }) {
  const { containerRef } = useYouTubePlayer({ videoId: track?.videoId, isPlaying });

  if (!track?.videoId) {
    return <div className={`youtube-frame empty ${className}`}>No video source</div>;
  }

  return (
    <div className={`youtube-frame ${className}`} data-testid="youtube-frame">
      <div ref={containerRef} />
    </div>
  );
}
