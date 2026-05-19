import { useEffect, useRef } from "react";
import { useLyrics } from "../../hooks/useLyrics.js";

export function LyricsPanel({ trackId, positionMs = 0 }) {
  const { data, isLoading } = useLyrics(trackId);
  const containerRef = useRef(null);

  const activeIndex =
    data?.synced?.findLastIndex?.((line) => line.timeMs <= positionMs) ??
    data?.synced?.reduce((match, line, index) => (line.timeMs <= positionMs ? index : match), -1);

  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector(".lyrics-line.active");
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest"
      });
    }
  }, [activeIndex]);

  if (!trackId) return <p className="empty-state">Play a track to see lyrics.</p>;
  if (isLoading) return <p className="empty-state">Loading lyrics.</p>;
  if (!data?.synced?.length && !data?.plain) return <p className="empty-state">Lyrics unavailable.</p>;

  return (
    <section className="lyrics-panel">
      <header className="section-header">
        <h2>Lyrics</h2>
        <span>{data.source}</span>
      </header>
      {data.synced?.length ? (
        <div className="lyrics-lines" ref={containerRef}>
          {data.synced.map((line, index) => (
            <p
              key={`${line.timeMs}-${line.text}`}
              className={`lyrics-line ${index === activeIndex ? "active" : ""}`}
            >
              {line.text}
            </p>
          ))}
        </div>
      ) : (
        <pre className="plain-lyrics">{data.plain}</pre>
      )}
    </section>
  );
}
