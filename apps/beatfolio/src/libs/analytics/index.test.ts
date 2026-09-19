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
  let fetchMock: ReturnType<
    typeof vi.fn<(url: string, init: RequestInit) => Promise<Response>>
  >;

  beforeEach(() => {
    sendBeacon = vi.fn<(url: string, data: CapturedBlob) => boolean>(
      () => true,
    );
    fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(
      async () => new Response(null, { status: 204 }),
    );
    vi.stubGlobal("navigator", { sendBeacon });
    vi.stubGlobal("fetch", fetchMock);
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
    expect(fetchMock).not.toHaveBeenCalled();
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

  it("sendBeaconがキューに積めずfalseを返したらkeepalive付きfetchへフォールバックする", () => {
    sendBeacon.mockReturnValue(false);

    track({
      type: "support_click",
      artistId: "artist-1",
      platform: "youtube",
      position: "after-story",
    });

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/events");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(init.headers).toStrictEqual({
      "content-type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toStrictEqual({
      eventType: "support_click",
      artistId: "artist-1",
      path: "/players/handle",
      referrer: "https://example.com/announce",
      props: { platform: "youtube", position: "after-story" },
    });
  });

  it("sendBeaconが無い環境ではkeepalive付きfetchで送る", () => {
    vi.stubGlobal("navigator", {});

    track({ type: "notify_subscribe", artistId: "artist-1" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.keepalive).toBe(true);
  });

  it("フォールバックのfetchが失敗しても例外を外へ出さない", async () => {
    vi.stubGlobal("navigator", {});
    fetchMock.mockRejectedValue(new Error("network down"));

    expect(() =>
      track({ type: "notify_subscribe", artistId: "artist-1" }),
    ).not.toThrow();
    await expect(fetchMock.mock.results[0].value).rejects.toThrow(
      "network down",
    );
  });
});
