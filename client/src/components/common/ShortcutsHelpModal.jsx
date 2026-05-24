import { X, Keyboard } from "lucide-react";
import { useEffect } from "react";
import { usePlayerStore } from "../../store/playerStore.js";

const SHORTCUTS = [
  { keys: ["Space"], desc: "Play / Pause" },
  { keys: ["←", "→"], desc: "Seek backward / forward 5s" },
  { keys: ["↑", "↓"], desc: "Increase / decrease volume 10%" },
  { keys: ["N"], desc: "Next track" },
  { keys: ["P"], desc: "Previous track" },
  { keys: ["S"], desc: "Toggle shuffle" },
  { keys: ["R"], desc: "Cycle repeat mode (Off, All, One)" },
  { keys: ["L"], desc: "Like / unlike current track" },
  { keys: ["?"], desc: "Toggle keyboard shortcuts help" }
];

export function ShortcutsHelpModal() {
  const isOpen = usePlayerStore((state) => state.shortcutsHelpOpen);
  const setOpen = usePlayerStore((state) => state.setShortcutsHelpOpen);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  const overlayClass = "fixed inset-0 bg-[rgba(0,0,0,0.7)] backdrop-blur-[8px] flex items-center justify-center z-[1000] animate-fade-in";
  const cardClass = "bg-[rgba(20,24,22,0.85)] border border-[rgba(255,255,255,0.08)] rounded-[12px] backdrop-blur-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] w-[90%] max-w-[480px] overflow-hidden animate-slide-up";
  const headerClass = "flex items-center justify-between py-[16px] px-[20px] border-b border-[rgba(255,255,255,0.06)]";
  const titleGroupClass = "flex items-center gap-[10px]";
  const titleClass = "text-[1.15rem] font-bold m-0 text-ink";
  const bodyClass = "p-[20px] max-h-[70vh] overflow-y-auto";
  const gridClass = "flex flex-col gap-[12px]";
  const rowClass = "flex items-center justify-between pb-[8px] border-b border-[rgba(255,255,255,0.04)] last:border-0";
  const keysContainerClass = "flex gap-[6px]";
  const kbdClass = "bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] border-b-[3px] rounded-[4px] text-white font-mono text-[0.78rem] font-semibold py-[3px] px-[6px] min-w-[24px] text-center shadow-[0_1px_2px_rgba(0,0,0,0.2)]";
  const descClass = "text-[0.9rem] text-[#c4cdc4]";

  const closeBtnClass = "w-[32px] h-[32px] inline-flex items-center justify-center rounded-full border-0 bg-transparent text-muted cursor-pointer transition-colors hover:text-ink hover:bg-[rgba(255,255,255,0.07)] active:scale-95";

  return (
    <div className={overlayClass} onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
      <div className={cardClass} onClick={(e) => e.stopPropagation()}>
        <header className={headerClass}>
          <div className={titleGroupClass}>
            <Keyboard size={20} className="text-accent" />
            <h2 id="shortcuts-title" className={titleClass}>Keyboard Shortcuts</h2>
          </div>
          <button type="button" className={closeBtnClass} onClick={() => setOpen(false)} aria-label="Close shortcuts">
            <X size={18} />
          </button>
        </header>
        <div className={bodyClass}>
          <div className={gridClass}>
            {SHORTCUTS.map((s) => (
              <div key={s.desc} className={rowClass}>
                <div className={keysContainerClass}>
                  {s.keys.map((k) => (
                    <kbd key={k} className={kbdClass}>{k}</kbd>
                  ))}
                </div>
                <span className={descClass}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
