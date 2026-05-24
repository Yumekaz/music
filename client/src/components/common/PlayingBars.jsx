/**
 * Animated equalizer bars — shown in the sidebar next to the currently playing item.
 * Three bars bounce when playing, freeze mid-height when paused/buffering.
 */
export function PlayingBars({ isPlaying, isBuffering }) {
  const paused = !isPlaying || isBuffering;
  const barClass = paused
    ? "h-[9px] opacity-60"
    : "animate-playing-bar";

  return (
    <span
      className="inline-flex h-[16px] w-[16px] items-end justify-center gap-[2px] text-accent"
      aria-label={isBuffering ? "Loading" : isPlaying ? "Now playing" : "Paused"}
      role="img"
    >
      <span className={`block w-[3px] rounded-full bg-current ${barClass}`} />
      <span className={`block w-[3px] rounded-full bg-current [animation-delay:120ms] ${barClass}`} />
      <span className={`block w-[3px] rounded-full bg-current [animation-delay:240ms] ${barClass}`} />
    </span>
  );
}
