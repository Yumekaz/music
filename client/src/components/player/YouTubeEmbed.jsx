import { useYouTubePlayer } from "../../hooks/useYouTubePlayer.js";

export function YouTubeEmbed({ track, nextVideoId, isPlaying, className = "" }) {
  const { containerARef, containerBRef, activePlayer } = useYouTubePlayer({
    videoId: track?.videoId,
    nextVideoId,
    isPlaying
  });

  const wrapperClass = `relative overflow-hidden bg-panel ${className} ${!track?.videoId ? "grid place-items-center text-muted" : ""}`;
  const frameClass = (active) =>
    `absolute inset-0 h-full w-full transition-opacity duration-200 ${active ? "opacity-100 pointer-events-auto z-[2]" : "opacity-0 pointer-events-none z-[1]"}`;

  return (
    <div className={wrapperClass} data-testid="youtube-wrapper">
      <div
        className={frameClass(activePlayer === "A")}
        ref={containerARef}
      />
      <div
        className={frameClass(activePlayer === "B")}
        ref={containerBRef}
      />
    </div>
  );
}
