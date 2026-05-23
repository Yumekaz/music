import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Equalizer } from "./Equalizer.jsx";
import { useSettingsStore } from "../../store/settingsStore.js";

describe("Equalizer", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      equalizerOpen: false,
      equalizerEnabled: false,
      equalizerPreset: "Normal",
      equalizerGains: [0, 0, 0, 0, 0, 0, 0, 0]
    });
  });

  it("explains that EQ is disabled for YouTube playback", () => {
    const ref = { current: null };
    render(<Equalizer audioRef={ref} enabled={false} />);

    expect(screen.getByText("EQ applies to preview and Jamendo tracks.")).toBeInTheDocument();
  });

  it("opens the panel without relying on persisted settings state", () => {
    const ref = { current: null };
    render(<Equalizer audioRef={ref} enabled />);

    fireEvent.click(screen.getByRole("button", { name: "EQ" }));

    expect(useSettingsStore.getState().equalizerOpen).toBe(true);
    expect(useSettingsStore.getState().equalizerEnabled).toBe(true);
    expect(screen.getByRole("combobox", { name: "Preset:" })).toBeInTheDocument();
  });
});
