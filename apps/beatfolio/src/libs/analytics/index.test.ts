import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { track } from "./index";

type CapturedBlob = {
  parts: string[];
  type: string;
};

class RecordingBlob implements CapturedBlob {
  parts: string[];
  type: string;

  constructor(parts: string[], options: { type: string }) {
    this.parts = parts;
    this.type = options.type;
  }
}

describe("track", () => {
  let sendBeacon: ReturnType<
    typeof vi.fn<(url: string, data: CapturedBlob) => boolean>
  >;

  beforeEach(() => {
    sendBeacon = vi.fn<(url: string, data: CapturedBlob) => boolean>();
    vi.stubGlobal("navigator", { sendBeacon });
    vi.stubGlobal("Blob", RecordingBlob);
    Object.defineProperty(window, "location", {
      value: { pathname: "/players/handle" },
      configurable: true,
    });
    Object.defineProperty(document, "referrer", {
      value: "https://example.com/announce",
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const readBeaconBody = (): Record<string, unknown> => {
    const [, blob] = sendBeacon.mock.calls[0];
    return JSON.parse(blob.parts[0]);
  };

  it("/api/eventsへBlobでsendBeaconする", () => {
    track({ type: "profile_view", artistId: "artist-1", from: "announce" });

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [url, blob] = sendBeacon.mock.calls[0];
    expect(url).toBe("/api/events");
    expect(blob.type).toBe("application/json");
  });

  it("eventType/artistId/path/referrerと種別ごとのpropsを送る", () => {
    track({ type: "profile_view", artistId: "artist-1", from: "announce" });

    expect(readBeaconBody()).toStrictEqual({
      eventType: "profile_view",
      artistId: "artist-1",
      path: "/players/handle",
      referrer: "https://example.com/announce",
      props: { from: "announce" },
    });
  });

  it("story_scrollのdepthをpropsへ入れる", () => {
    track({ type: "story_scroll", artistId: "artist-1", depth: 50 });

    const body = readBeaconBody();
    expect(body.eventType).toBe("story_scroll");
    expect(body.props).toEqual({ depth: 50 });
  });

  it("artistIdを持たないイベント（invite系）はnullを送る", () => {
    track({
      type: "invite_open",
      artistId: null,
      inviterArtistId: "artist-2",
    });

    const body = readBeaconBody();
    expect(body.artistId).toBeNull();
    expect(body.props).toEqual({ inviterArtistId: "artist-2" });
  });

  it("document.referrerが空文字ならnullを送る", () => {
    Object.defineProperty(document, "referrer", {
      value: "",
      configurable: true,
    });

    track({ type: "story_expand", artistId: "artist-1" });

    expect(readBeaconBody().referrer).toBeNull();
  });

  it("sendBeaconが無い環境では何もしない", () => {
    vi.stubGlobal("navigator", {});

    expect(() =>
      track({ type: "notify_subscribe", artistId: "artist-1" }),
    ).not.toThrow();
    expect(sendBeacon).not.toHaveBeenCalled();
  });
});
