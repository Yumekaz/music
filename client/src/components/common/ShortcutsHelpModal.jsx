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

  return (
    <div className="modal-overlay" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
      <div className="modal-card shortcuts-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-title-group">
            <Keyboard size={20} className="accent-text" />
            <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
          </div>
          <button type="button" className="icon-button icon-button--small" onClick={() => setOpen(false)} aria-label="Close shortcuts">
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">
          <div className="shortcuts-grid">
            {SHORTCUTS.map((s) => (
              <div key={s.desc} className="shortcut-row">
                <div className="shortcut-keys">
                  {s.keys.map((k) => (
                    <kbd key={k} className="kbd-key">{k}</kbd>
                  ))}
                </div>
                <span className="shortcut-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
