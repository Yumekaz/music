import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayerStore } from "../store/playerStore.js";
import { useYouTubePlayer } from "./useYouTubePlayer.js";

vi.mock("../lib/directAudio.js", () => ({
  getDirectAudioElement: vi.fn(() => null),
  syncAudioStateSync: vi.fn()
}));

function installYouTubeMock() {
  const players = [];

  class FakePlayer {
    constructor(element, options = {}) {
      this.element = element;
      this.events = options.events || {};
      this.videoId = options.videoId || "";
      this.playCalls = 0;
      this.pauseCalls = 0;
      this.stopCalls = 0;
      this.cueCalls = [];
      this.loadCalls = [];
      players.push(this);

      window.setTimeout(() => {
        this.events.onReady?.({ target: this });
      }, 0);
    }

    emit(data) {
      this.events.onStateChange?.({ target: this, data });
    }

    cueVideoById(videoId) {
      this.videoId = videoId;
      this.cueCalls.push(videoId);
    }

    loadVideoById(videoId) {
      this.videoId = videoId;
      this.loadCalls.push(videoId);
      this.emit(window.YT.PlayerState.BUFFERING);
    }

    playVideo() {
      this.playCalls += 1;
      this.emit(window.YT.PlayerState.PLAYING);
    }

    pauseVideo() {
      this.pauseCalls += 1;
      this.emit(window.YT.PlayerState.PAUSED);
    }

    stopVideo() {
      this.stopCalls += 1;
      this.emit(window.YT.PlayerState.PAUSED);
    }

    getAvailableQualityLevels() {
      return [];
    }

    setVolume() {}
    setPlaybackQuality() {}
    getCurrentTime() { return 0; }
    getDuration() { return 0; }
    destroy() {}
  }

  window.YT = {
    Player: FakePlayer,
    PlayerState: {
      ENDED: 0,
      PLAYING: 1,
      PAUSED: 2,
      BUFFERING: 3,
      CUED: 5
    }
  };

  return players;
}

function YouTubeHarness({ videoId, nextVideoId, isPlaying = true }) {
  const { containerARef, containerBRef } = useYouTubePlayer({ videoId, nextVideoId, isPlaying });

  return (
    <>
      <div data-testid="player-a" ref={containerARef} />
      <div data-testid="player-b" ref={containerBRef} />
    </>
  );
}

describe("useYouTubePlayer", () => {
  let players;

  beforeEach(() => {
    players = installYouTubeMock();
    usePlayerStore.setState({
      currentTrack: { id: "track-one", videoId: "video-one" },
      sourceType: "youtube",
      isPlaying: true,
      isBuffering: false,
      positionMs: 0,
      durationMs: 0,
      seekTarget: null
    });
  });

  afterEach(() => {
    delete window.YT;
    delete window.onYouTubeIframeAPIReady;
  });

  it("keeps manual next playback active when swapping to a pre-buffered YouTube iframe", async () => {
    const { rerender } = render(
      <YouTubeHarness videoId="video-one" nextVideoId="video-two" isPlaying />
    );

    await waitFor(() => expect(players).toHaveLength(2));
    await waitFor(() => expect(players[1].cueCalls).toContain("video-two"));

    rerender(<YouTubeHarness videoId="video-two" nextVideoId={null} isPlaying />);

    await waitFor(() => expect(players[0].stopCalls).toBe(1));
    await waitFor(() => expect(players[1].playCalls).toBeGreaterThan(0));

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(players[1].pauseCalls).toBe(0);
  });
});
