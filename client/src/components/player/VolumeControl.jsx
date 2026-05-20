import { Volume2 } from "lucide-react";

export function VolumeControl({ volume, onVolume }) {
  return (
    <label className="volume-control" onClick={(e) => e.stopPropagation()}>
      <Volume2 size={16} aria-hidden="true" />
      <input
        aria-label="Volume"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(event) => onVolume(Number(event.target.value))}
        style={{ "--volume-percent": `${volume * 100}%` }}
      />
    </label>
  );
}

