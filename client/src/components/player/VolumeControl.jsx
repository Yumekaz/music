import { Volume2 } from "lucide-react";

export function VolumeControl({ volume, onVolume }) {
  return (
    <label className="volume-control" title="App Volume" onClick={(e) => e.stopPropagation()}>
      <Volume2 size={16} aria-hidden="true" />
      <span className="volume-label">App Volume</span>
      <input
        aria-label="App Volume"
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
