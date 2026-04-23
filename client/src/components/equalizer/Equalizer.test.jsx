import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Equalizer } from "./Equalizer.jsx";

describe("Equalizer", () => {
  it("explains that EQ is disabled for YouTube playback", () => {
    const ref = { current: null };
    render(<Equalizer audioRef={ref} enabled={false} />);

    expect(screen.getByText("EQ applies to preview and Jamendo tracks.")).toBeInTheDocument();
  });
});
