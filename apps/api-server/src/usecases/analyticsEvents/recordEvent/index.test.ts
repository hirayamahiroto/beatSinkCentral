import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { recordEvent, type RecordEventUsecaseInput } from "./index";
import type { IAnalyticsEventWriter } from "../../../domain/analyticsEvents/repositories";
import type { PublicWriteCapabilities } from "../../../capabilities";

const NOW = new Date("2026-09-10T03:00:00.000Z");

const buildInput = (
  overrides: Partial<RecordEventUsecaseInput> = {},
): RecordEventUsecaseInput => ({
  eventType: "profile_view",
  artistId: "artist-1",
  anonId: "anon-1",
  sessionId: "session-1",
  path: "/players/handle",
  referrer: null,
  props: { from: "announce" },
  ...overrides,
});

describe("recordEvent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("有効な入力でイベントを現在時刻付きでrecordし、okを返す", async () => {
    const record = vi.fn<IAnalyticsEventWriter["record"]>(
      async () => undefined,
    );
    const caps = { analyticsEvents: { record } } satisfies Pick<
      PublicWriteCapabilities,
      "analyticsEvents"
    >;

    const result = await recordEvent(caps, buildInput());

    expect(result.ok).toBe(true);
    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith({
      id: expect.any(String),
      eventType: "profile_view",
      artistId: "artist-1",
      anonId: "anon-1",
      sessionId: "session-1",
      path: "/players/handle",
      referrer: null,
      from: "announce",
      props: null,
      occurredAt: NOW,
    });
  });

  it("未知のeventTypeはrecordを呼ばずerrを返す", async () => {
    const record = vi.fn<IAnalyticsEventWriter["record"]>();
    const caps = { analyticsEvents: { record } } satisfies Pick<
      PublicWriteCapabilities,
      "analyticsEvents"
    >;

    const result = await recordEvent(
      caps,
      buildInput({ eventType: "unknown_event" }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidEventTypeFormatError");
    }
    expect(record).not.toHaveBeenCalled();
  });
});
