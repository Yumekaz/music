import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Bug, ChevronDown, Download, Github, RotateCcw, Music2, Server, SlidersHorizontal, Tv2 } from "lucide-react";
import { useSettingsStore } from "../store/settingsStore.js";
import { usePlayerStore } from "../store/playerStore.js";
import { useEqualizer } from "../hooks/useEqualizer.js";
import { usePWAInstall } from "../hooks/usePWAInstall.js";
import { EQUALIZER_PRESETS } from "../components/equalizer/EqualizerPresets.js";
import { isDirectAudioSource } from "../lib/resolvers.js";
import { getBrowserCapabilities, getBackgroundStrategyLabel } from "../lib/browserCapabilities.js";
import { getChromeBackgroundHandoff } from "../lib/browserPlayback.js";
import { getPlaybackEngineLabel } from "../lib/playbackController.js";
import { getReadinessLabel } from "../lib/queuePreflight.js";
import { getProviderStatus } from "../services/providers.js";

const QUALITY_OPTIONS = [
  { value: "default", label: "Auto",   desc: "YouTube chooses the best quality" },
  { value: "small",   label: "240p",   desc: "Lowest data usage" },
  { value: "medium",  label: "360p",   desc: "Low data usage" },
  { value: "large",   label: "480p",   desc: "Standard" },
  { value: "hd720",   label: "720p",   desc: "HD — recommended" },
  { value: "hd1080",  label: "1080p",  desc: "Full HD" },
  { value: "highres", label: "4K",     desc: "Highest quality" },
];

const BANDS = [
  { label: "60",  frequency: 60 },
  { label: "170", frequency: 170 },
  { label: "310", frequency: 310 },
  { label: "600", frequency: 600 },
  { label: "1k",  frequency: 1000 },
  { label: "3k",  frequency: 3000 },
  { label: "6k",  frequency: 6000 },
  { label: "12k", frequency: 12000 },
];

export default function Settings() {
  const [providerStatus, setProviderStatus] = useState(null);
  const [providerError, setProviderError] = useState("");
  const [chromeHandoff, setChromeHandoff] = useState(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const { canInstall, install } = usePWAInstall();

  const {
    crossfadeDuration,   setCrossfadeDuration,
    playbackQuality,     setPlaybackQuality,
    equalizerPreset,     equalizerGains, equalizerEnabled,
    setBandGain,         setEqualizerPreset, setEqualizerEnabled,
    mobileBackgroundFallback, setMobileBackgroundFallback,
  } = useSettingsStore();

  const sourceType = usePlayerStore((state) => state.sourceType);
  const activeEngine = usePlayerStore((state) => state.activeEngine);
  const queueReadiness = usePlayerStore((state) => state.queueReadiness);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const directEnabled = isDirectAudioSource(sourceType);
  const browserCapabilities = useMemo(
    () => getBrowserCapabilities({ mobileBackgroundFallback }),
    [mobileBackgroundFallback]
  );
  const readinessEntries = Object.entries(queueReadiness || {}).slice(0, 4);

  // EQ hook needs an audio ref — pull the singleton element
  const audioRef = useRef(
    typeof Audio !== "undefined"
      ? (document.querySelector("audio") ?? null)
      : null
  );
  useEqualizer(audioRef, directEnabled && equalizerEnabled, equalizerGains);

  function resetEQ() {
    setEqualizerPreset("Normal", EQUALIZER_PRESETS["Normal"]);
  }

  useEffect(() => {
    if (!diagnosticsOpen) return;

    let cancelled = false;
    getProviderStatus()
      .then((status) => {
        if (cancelled) return;
        setProviderStatus(status);
        setProviderError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setProviderError(error?.message || "Provider status unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, [diagnosticsOpen]);

  useEffect(() => {
    if (!diagnosticsOpen) return;

    setChromeHandoff(getChromeBackgroundHandoff());
    const interval = window.setInterval(() => {
      setChromeHandoff(getChromeBackgroundHandoff());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [diagnosticsOpen]);

  const crossfadeLabel =
    crossfadeDuration === 0 ? "Off" : `${crossfadeDuration}s`;

  const pageClass = "mx-auto grid w-full max-w-[1040px] gap-[28px] pb-[32px] text-ink";
  const headerClass = "flex items-center justify-between";
  const sectionClass = "grid gap-[12px]";
  const sectionTitleClass = "inline-flex items-center gap-[9px] text-[0.78rem] font-bold uppercase tracking-[0.08em] text-muted";
  const cardClass = "grid gap-[20px] rounded-[10px] border border-line bg-[rgba(16,21,16,0.72)] p-[18px] shadow-[0_18px_46px_rgba(0,0,0,0.22)] md:p-[22px]";
  const rowClass = "grid gap-[16px] md:grid-cols-[minmax(0,1fr)_minmax(240px,340px)] md:items-center";
  const compactRowClass = "flex items-center justify-between gap-[16px]";
  const labelClass = "grid min-w-0 gap-[4px]";
  const labelTitleClass = "m-0 text-[1rem] font-bold text-ink";
  const labelHelpClass = "m-0 text-[0.88rem] leading-[1.5] text-muted";
  const noteClass = "m-0 text-[0.88rem] leading-[1.55] text-muted";
  const primaryActionClass = "inline-flex min-h-[38px] items-center justify-center gap-[8px] rounded-full border-0 bg-ink px-[16px] text-[0.9rem] font-bold text-night transition-transform hover:scale-[1.03] active:scale-[0.96]";
  const outlineActionClass = "inline-flex min-h-[36px] items-center justify-center gap-[8px] rounded-full border border-line bg-night px-[14px] text-[0.85rem] font-bold text-ink transition-colors hover:border-accent hover:text-accent active:scale-[0.96]";
  const sliderClass = "h-[5px] w-full cursor-pointer appearance-none rounded-full accent-accent outline-none";
  const sliderTicksClass = "flex justify-between text-[0.72rem] font-semibold text-muted";
  const toggleClass = (on) =>
    `relative h-[30px] w-[54px] shrink-0 rounded-full border transition-colors ${
      on ? "border-accent bg-accent" : "border-line bg-[rgba(255,255,255,0.08)]"
    }`;
  const toggleThumbClass = (on) =>
    `absolute top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full bg-ink shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-transform ${
      on ? "translate-x-[27px]" : "translate-x-[4px]"
    }`;
  const disclosureClass = `grid w-full grid-cols-[1fr_auto] items-center gap-[12px] rounded-[10px] border border-line bg-[rgba(16,21,16,0.72)] p-[16px] text-left transition-colors hover:border-accent/60 ${
    diagnosticsOpen ? "border-accent/60" : ""
  }`;
  const diagnosticsGridClass = "grid gap-[10px] sm:grid-cols-2 lg:grid-cols-3";
  const diagnosticsTileClass = "grid min-w-0 gap-[4px] rounded-[8px] border border-line bg-night/60 p-[12px]";
  const diagnosticsLabelClass = "text-[0.72rem] font-bold uppercase tracking-[0.08em] text-muted";
  const diagnosticsValueClass = "truncate text-[0.9rem] font-bold text-ink";
  const diagnosticsBlockClass = "grid gap-[10px] rounded-[8px] border border-line bg-night/40 p-[12px]";
  const diagnosticsRowClass = "grid grid-cols-[minmax(0,1fr)_auto] gap-[12px] border-t border-line/70 py-[8px] first:border-t-0 first:pt-0 last:pb-0";
  const qualityGridClass = "grid gap-[10px] sm:grid-cols-2 lg:grid-cols-3";
  const qualityTileClass = (active) =>
    `relative grid gap-[4px] rounded-[8px] border p-[13px] text-left transition-colors ${
      active ? "border-accent bg-[rgba(30,215,96,0.1)] text-ink" : "border-line bg-night/60 text-ink hover:border-accent/60"
    }`;
  const presetChipClass = (active) =>
    `min-h-[34px] rounded-full border px-[13px] text-[0.82rem] font-bold transition-colors ${
      active ? "border-accent bg-accent text-night" : "border-line bg-night text-ink hover:border-accent hover:text-accent"
    }`;
  const eqBandsClass = "grid grid-cols-4 gap-[14px] pt-[4px] sm:grid-cols-8";
  const eqBandSliderClass = "h-[132px] w-[32px] cursor-pointer accent-accent disabled:cursor-not-allowed disabled:opacity-40 [direction:rtl] [writing-mode:vertical-lr]";
  const creditClass = "flex flex-wrap items-center justify-between gap-[12px] rounded-[10px] border border-line bg-[rgba(16,21,16,0.72)] p-[16px] text-muted";

  return (
    <div className={pageClass}>
      <header className={headerClass}>
        <h1 className="m-0 text-[clamp(1.8rem,4vw,3rem)] font-bold">Settings</h1>
      </header>

      {canInstall && (
        <section className={sectionClass}>
          <div className={sectionTitleClass}>
            <Download size={18} aria-hidden="true" />
            <span>App</span>
          </div>

          <div className={cardClass}>
            <div className={compactRowClass}>
              <div className={labelClass}>
                <p className={labelTitleClass}>Install Reverb</p>
                <span className={labelHelpClass}>Add Reverb to your device so it opens like an app.</span>
              </div>
              <button type="button" className={primaryActionClass} onClick={install}>
                <Download size={18} aria-hidden="true" />
                <span>Install</span>
              </button>
            </div>
          </div>
        </section>
      )}

      <section className={sectionClass}>
        <div className={sectionTitleClass}>
          <Music2 size={18} aria-hidden="true" />
          <span>Playback</span>
        </div>

        <div className={cardClass}>
          <div className={rowClass}>
            <div className={labelClass}>
              <p className={labelTitleClass}>Crossfade</p>
              <span className={labelHelpClass}>
                Smooth transition between tracks for iTunes and Jamendo previews.
                Set to 0 to disable.
              </span>
            </div>
            <div className="grid gap-[10px]">
              <span className="text-right text-[0.86rem] font-bold text-accent">{crossfadeLabel}</span>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={crossfadeDuration}
                onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                aria-label="Crossfade duration in seconds"
                className={sliderClass}
                style={{ background: `linear-gradient(to right, #1ed760 ${(crossfadeDuration / 12) * 100}%, #242c24 ${(crossfadeDuration / 12) * 100}%)` }}
              />
              <div className={sliderTicksClass}>
                <span>Off</span>
                <span>6s</span>
                <span>12s</span>
              </div>
            </div>
          </div>

          <div className={`${compactRowClass} border-t border-line pt-[20px]`}>
            <div className={labelClass}>
              <p className={labelTitleClass}>Mobile Background Playback</p>
              <span className={labelHelpClass}>
                Uses audio previews only on Chrome Android when the browser is minimized.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={mobileBackgroundFallback}
              className={toggleClass(mobileBackgroundFallback)}
              onClick={() => setMobileBackgroundFallback(!mobileBackgroundFallback)}
            >
              <span className={toggleThumbClass(mobileBackgroundFallback)} />
            </button>
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <button
          type="button"
          className={disclosureClass}
          aria-expanded={diagnosticsOpen}
          aria-controls="settings-diagnostics-panel"
          onClick={() => setDiagnosticsOpen((open) => !open)}
        >
          <span className="grid gap-[3px]">
            <span className={sectionTitleClass}>
              <Bug size={18} aria-hidden="true" />
              <span>Advanced</span>
            </span>
            <strong className="text-[1rem] text-ink">Playback Diagnostics</strong>
            <span className="text-[0.82rem] text-muted">Troubleshooting details</span>
          </span>
          <ChevronDown className={`transition-transform ${diagnosticsOpen ? "rotate-180" : ""}`} size={18} aria-hidden="true" />
        </button>

        {diagnosticsOpen && (
          <div id="settings-diagnostics-panel" className={cardClass}>
            <div className={diagnosticsGridClass}>
              <div className={diagnosticsTileClass}>
                <span className={diagnosticsLabelClass}>Browser</span>
                <strong className={diagnosticsValueClass}>{browserCapabilities.isOfficialChromeAndroid ? "Chrome Android" : browserCapabilities.isMobileBrowser ? "Mobile browser" : "Desktop browser"}</strong>
              </div>
              <div className={diagnosticsTileClass}>
                <span className={diagnosticsLabelClass}>Background</span>
                <strong className={diagnosticsValueClass}>{getBackgroundStrategyLabel(browserCapabilities.backgroundStrategy)}</strong>
              </div>
              <div className={diagnosticsTileClass}>
                <span className={diagnosticsLabelClass}>Engine</span>
                <strong className={diagnosticsValueClass}>{getPlaybackEngineLabel(activeEngine)}</strong>
              </div>
              <div className={diagnosticsTileClass}>
                <span className={diagnosticsLabelClass}>Source</span>
                <strong className={diagnosticsValueClass}>{sourceType}</strong>
              </div>
              <div className={diagnosticsTileClass}>
                <span className={diagnosticsLabelClass}>Media Session</span>
                <strong className={diagnosticsValueClass}>{browserCapabilities.supportsMediaSession ? "Supported" : "Unavailable"}</strong>
              </div>
              <div className={diagnosticsTileClass}>
                <span className={diagnosticsLabelClass}>Wake Lock</span>
                <strong className={diagnosticsValueClass}>{browserCapabilities.supportsWakeLock ? "Supported" : "Unavailable"}</strong>
              </div>
              <div className={diagnosticsTileClass}>
                <span className={diagnosticsLabelClass}>Current Track</span>
                <strong className={diagnosticsValueClass}>{currentTrack?.title || "None"}</strong>
              </div>
              <div className={diagnosticsTileClass}>
                <span className={diagnosticsLabelClass}>Chrome Handoff</span>
                <strong className={diagnosticsValueClass}>{chromeHandoff ? "Active" : "Idle"}</strong>
              </div>
            </div>

            <div className={diagnosticsBlockClass}>
              <div className={sectionTitleClass}>
                <Activity size={15} aria-hidden="true" />
                <span>Queue Readiness</span>
              </div>
              {readinessEntries.length ? (
                <div>
                  {readinessEntries.map(([trackId, readiness]) => (
                    <div key={trackId} className={diagnosticsRowClass}>
                      <span className="truncate text-muted">{trackId}</span>
                      <strong className="text-ink">{getReadinessLabel(readiness.status)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={noteClass}>No queue checks yet.</p>
              )}
            </div>

            <div className={diagnosticsBlockClass}>
              <div className={sectionTitleClass}>
                <Server size={15} aria-hidden="true" />
                <span>Provider Health</span>
              </div>
              {providerError ? (
                <p className={noteClass}>{providerError}</p>
              ) : providerStatus?.providers ? (
                <div>
                  {Object.entries(providerStatus.providers).map(([name, provider]) => (
                    <div key={name} className={diagnosticsRowClass}>
                      <span className="truncate text-muted">{name}</span>
                      <strong className="text-ink">{provider.status} / {provider.mode}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={noteClass}>Checking providers...</p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className={sectionClass}>
        <div className={sectionTitleClass}>
          <Tv2 size={18} aria-hidden="true" />
          <span>Video Quality</span>
        </div>

        <div className={cardClass}>
          <p className={noteClass}>
            Applies to YouTube playback. YouTube may override this based on
            connection speed and video availability.
          </p>
          <div className={qualityGridClass}>
            {QUALITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={qualityTileClass(playbackQuality === opt.value)}
                onClick={() => setPlaybackQuality(opt.value)}
              >
                <span className="text-[0.95rem] font-bold">{opt.label}</span>
                <span className="text-[0.8rem] leading-[1.35] text-muted">{opt.desc}</span>
                {playbackQuality === opt.value && (
                  <span className="absolute right-[12px] top-[10px] text-accent" aria-hidden="true">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className={sectionTitleClass}>
          <SlidersHorizontal size={18} aria-hidden="true" />
          <span>Equalizer</span>
        </div>

        <div className={cardClass}>
          <p className={noteClass}>
            Only applies to iTunes 30s previews and Jamendo tracks — not YouTube.
            Enable EQ, then pick a preset or drag the bands.
          </p>

          <div className={compactRowClass}>
            <div className={labelClass}>
              <p className={labelTitleClass}>Enable Equalizer</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={equalizerEnabled}
              className={toggleClass(equalizerEnabled)}
              onClick={() => setEqualizerEnabled(!equalizerEnabled)}
            >
              <span className={toggleThumbClass(equalizerEnabled)} />
            </button>
          </div>

          {equalizerEnabled && (
            <>
              <div className="flex flex-wrap gap-[8px]">
                {Object.keys(EQUALIZER_PRESETS).filter((p) => p !== "Custom").map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={presetChipClass(equalizerPreset === name)}
                    onClick={() => setEqualizerPreset(name, EQUALIZER_PRESETS[name])}
                  >
                    {name}
                  </button>
                ))}
                <button
                  type="button"
                  className={outlineActionClass}
                  onClick={resetEQ}
                  title="Reset to Normal"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              <div className={eqBandsClass}>
                {BANDS.map((band, index) => {
                  const gain = equalizerGains[index] ?? 0;
                  return (
                    <div key={band.frequency} className="grid min-w-0 justify-items-center gap-[8px]">
                      <span className="text-[0.72rem] font-bold text-muted">
                        {gain > 0 ? `+${gain}` : gain}
                      </span>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={gain}
                        disabled={!directEnabled}
                        onChange={(e) => setBandGain(index, Number(e.target.value))}
                        aria-label={`${band.label} Hz gain`}
                        className={eqBandSliderClass}
                        orient="vertical"
                      />
                      <span className="text-[0.76rem] font-bold text-muted">{band.label}</span>
                    </div>
                  );
                })}
              </div>

              {!directEnabled && (
                <p className={noteClass}>
                  Play an iTunes or Jamendo preview to activate EQ.
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <section className={sectionClass} aria-label="App credits">
        <div className={creditClass}>
          <span className="font-semibold">Built by Mihir</span>
          <a
            href="https://github.com/Yumekaz/music"
            target="_blank"
            rel="noreferrer"
            aria-label="Open Mihir's GitHub repository"
            className={outlineActionClass}
          >
            <Github size={16} aria-hidden="true" />
            <span>GitHub repo</span>
          </a>
        </div>
      </section>
    </div>
  );
}
