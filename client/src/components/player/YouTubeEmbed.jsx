import { useYouTubePlayer } from "../../hooks/useYouTubePlayer.js";

export function YouTubeEmbed({ track, nextVideoId, isPlaying, className = "" }) {
  const { containerARef, containerBRef, activePlayer } = useYouTubePlayer({ 
    videoId: track?.videoId, 
    nextVideoId,
    isPlaying 
  });

  return (
    <div className={`youtube-frame-wrapper ${className} ${!track?.videoId ? 'empty' : ''}`} data-testid="youtube-wrapper">
      <div 
        className={`youtube-frame youtube-frame-a ${activePlayer === 'A' ? 'active' : 'standby'}`}
        ref={containerARef}
      />
      <div 
        className={`youtube-frame youtube-frame-b ${activePlayer === 'B' ? 'active' : 'standby'}`}
        ref={containerBRef}
      />
    </div>
  );
}
