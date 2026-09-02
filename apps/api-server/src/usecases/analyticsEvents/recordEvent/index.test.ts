import { describe, it, expect, vi } from "vitest";
import { recordEvent, type RecordEventUsecaseInput } from "./index";

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
  it("有効な入力でイベントをrecordし、okを返す", async () => {
    const record = vi.fn().mockResolvedValue(undefined);

    const result = await recordEvent(
      { analyticsEvents: { record } },
      buildInput(),
    );

    expect(result.ok).toBe(true);
    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "profile_view",
        artistId: "artist-1",
        from: "announce",
      }),
    );
  });

  it("未知のeventTypeはrecordを呼ばずerrを返す", async () => {
    const record = vi.fn();

    const result = await recordEvent(
      { analyticsEvents: { record } },
      buildInput({ eventType: "unknown_event" }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidEventTypeFormatError");
    }
    expect(record).not.toHaveBeenCalled();
  });
});
