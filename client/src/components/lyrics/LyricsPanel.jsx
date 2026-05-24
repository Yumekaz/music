import { useEffect, useRef } from "react";
import { useLyrics } from "../../hooks/useLyrics.js";

export function LyricsPanel({ track, positionMs = 0 }) {
  const trackId = track?.id;
  const title = track?.title;
  const artistName = track?.artistName;
  const { data, isLoading } = useLyrics(trackId, title, artistName);
  const containerRef = useRef(null);

  const activeIndex =
    data?.synced?.findLastIndex?.((line) => line.timeMs <= positionMs) ??
    data?.synced?.reduce((match, line, index) => (line.timeMs <= positionMs ? index : match), -1);

  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector("[data-active='true']");
    if (activeEl) {
      const container = containerRef.current;
      const elemTop = activeEl.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      const targetScrollTop = elemTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);

      container.scrollTo({
        top: targetScrollTop,
        behavior: "smooth"
      });
    }
  }, [activeIndex]);

  if (!trackId) return <p className="text-muted m-0 p-[24px]">Play a track to see lyrics.</p>;
  if (isLoading) return <p className="text-muted m-0 p-[24px]">Loading lyrics.</p>;
  if (!data?.synced?.length && !data?.plain) return <p className="text-muted m-0 p-[24px]">Lyrics unavailable.</p>;

  const panelClass = "col-span-full grid gap-[16px] pt-[8px]";
  const headerClass = "flex items-center justify-between gap-[16px] min-h-[36px] flex-wrap";

  // Custom scrollbar hiding and mask image are best done with inline styles if complex, but mask image is simple enough here:
  const linesContainerClass = "flex flex-col gap-[22px] text-[#7d887d] text-[clamp(1.2rem,3vw,1.8rem)] leading-[1.3] max-h-[400px] overflow-y-auto scroll-smooth py-[180px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
  const maskStyle = {
    maskImage: "linear-gradient(to bottom, transparent 0%, white 25%, white 75%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, white 25%, white 75%, transparent 100%)"
  };

  const getLineClass = (isActive) => {
    let base = "m-0 font-bold cursor-pointer origin-left transition-all duration-400 ease-in-out hover:opacity-60";
    if (isActive) {
      base += " text-white opacity-100 scale-[1.04] [text-shadow:0_0_15px_rgba(255,255,255,0.2)]";
    } else {
      base += " opacity-[0.35] scale-96";
    }
    return base;
  };

  const plainLineClass = "m-0 font-bold text-white opacity-85 transition-opacity duration-200 hover:opacity-100";

  return (
    <section className={panelClass}>
      <header className={headerClass}>
        <h2 className="m-0 text-[1.2rem] font-bold text-ink">Lyrics</h2>
        <span className="text-muted text-[0.8rem] font-bold uppercase tracking-[0.05em]">{data.source}</span>
      </header>
      {data.synced?.length ? (
        <div className={linesContainerClass} style={maskStyle} ref={containerRef}>
          {data.synced.map((line, index) => (
            <p
              key={`${line.timeMs}-${line.text}`}
              className={getLineClass(index === activeIndex)}
              data-active={index === activeIndex}
            >
              {line.text}
            </p>
          ))}
        </div>
      ) : (
        <div className={linesContainerClass} style={maskStyle}>
          {data.plain.split("\n").map((line, index) => (
            <p key={index} className={plainLineClass}>
              {line.trim() || "\u00A0"}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
