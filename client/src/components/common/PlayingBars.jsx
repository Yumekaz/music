/**
 * Animated equalizer bars — shown in the sidebar next to the currently playing item.
 * Three bars bounce when playing, freeze mid-height when paused/buffering.
 */
export function PlayingBars({ isPlaying, isBuffering }) {
  const paused = !isPlaying || isBuffering;
  return (
    <span
      className={`playing-bars${paused ? " playing-bars--paused" : ""}`}
      aria-label={isBuffering ? "Loading" : isPlaying ? "Now playing" : "Paused"}
      role="img"
    >
      <span />
      <span />
      <span />
    </span>
  );
}
