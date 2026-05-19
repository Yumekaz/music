import { SlidersHorizontal } from "lucide-react";
import { useEqualizer } from "../../hooks/useEqualizer.js";
import { useSettingsStore } from "../../store/settingsStore.js";
import { EQUALIZER_PRESETS } from "./EqualizerPresets.js";

export function Equalizer({ audioRef, enabled }) {
  const {
    equalizerOpen,
    equalizerPreset,
    equalizerGains,
    setBandGain,
    setEqualizerOpen,
    setEqualizerPreset
  } = useSettingsStore();
  const { bands } = useEqualizer(audioRef, enabled && equalizerOpen, equalizerGains);

  return (
    <section className="equalizer" aria-label="Equalizer">
      <button
        type="button"
        className="utility-button"
        onClick={() => setEqualizerOpen(!equalizerOpen)}
        aria-expanded={equalizerOpen}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        <span>EQ</span>
      </button>
      {!enabled ? <p className="eq-note">EQ applies to preview and Jamendo tracks.</p> : null}
      {equalizerOpen ? (
        <div className="eq-panel">
          <div className="eq-presets-container">
            <label htmlFor="eq-preset-select" className="eq-label">Preset:</label>
            <select
              id="eq-preset-select"
              className="eq-select"
              value={equalizerPreset}
              onChange={(e) => {
                const name = e.target.value;
                setEqualizerPreset(name, EQUALIZER_PRESETS[name]);
              }}
            >
              {Object.keys(EQUALIZER_PRESETS).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="eq-bands">
            {bands.map((band, index) => (
              <label key={band.frequency}>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={equalizerGains[index]}
                  disabled={!enabled}
                  onChange={(event) => setBandGain(index, Number(event.target.value))}
                  aria-label={`${band.label} Hz gain`}
                />
                <span>{band.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
