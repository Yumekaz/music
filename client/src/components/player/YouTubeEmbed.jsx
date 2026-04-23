import { useYouTubePlayer } from "../../hooks/useYouTubePlayer.js";

export function YouTubeEmbed({ track, isPlaying, className = "" }) {
  const { iframeRef, src } = useYouTubePlayer({ videoId: track?.videoId, isPlaying });

  if (!track?.videoId) {
    return <div className={`youtube-frame empty ${className}`}>No video source</div>;
  }

  return (
    <div className={`youtube-frame ${className}`} data-testid="youtube-frame">
      <iframe
        ref={iframeRef}
        src={src}
        title={`${track.title} by ${track.artistName}`}
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
