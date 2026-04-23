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
          <div className="eq-presets" role="list" aria-label="Equalizer presets">
            {Object.entries(EQUALIZER_PRESETS).map(([name, gains]) => (
              <button
                type="button"
                key={name}
                className={name === equalizerPreset ? "active" : ""}
                onClick={() => setEqualizerPreset(name, gains)}
              >
                {name}
              </button>
            ))}
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
