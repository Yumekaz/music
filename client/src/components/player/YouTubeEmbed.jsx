import { useYouTubePlayer } from "../../hooks/useYouTubePlayer.js";

export function YouTubeEmbed({ track, isPlaying, className = "" }) {
  const { containerRef } = useYouTubePlayer({ videoId: track?.videoId, isPlaying });

  return (
    <div 
      className={`youtube-frame ${className} ${!track?.videoId ? 'empty' : ''}`} 
      data-testid="youtube-frame"
      ref={containerRef}
    />
  );
}
