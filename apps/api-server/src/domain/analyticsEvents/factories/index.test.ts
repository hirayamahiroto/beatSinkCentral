import { describe, it, expect } from "vitest";
import { createAnalyticsEvent, type RecordEventInput } from "./index";

const buildInput = (
  overrides: Partial<RecordEventInput> = {},
): RecordEventInput => ({
  eventType: "profile_view",
  artistId: "artist-1",
  anonId: "anon-1",
  sessionId: "session-1",
  path: "/players/handle",
  referrer: "https://example.com",
  props: { from: "announce" },
  ...overrides,
});

describe("createAnalyticsEvent", () => {
  it("有効な入力でAnalyticsEventを作成する", () => {
    const result = createAnalyticsEvent(buildInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.toPersistence().eventType).toBe("profile_view");
    expect(result.value.getId()).toBeTruthy();
  });

  it("anonId/sessionId/path/referrer/artistIdを入れ替えずそのまま永続化データへ渡す", () => {
    const result = createAnalyticsEvent(
      buildInput({
        artistId: "artist-1",
        anonId: "anon-1",
        sessionId: "session-1",
        path: "/players/handle",
        referrer: "https://example.com",
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.value.toPersistence();
    expect(data.artistId).toBe("artist-1");
    expect(data.anonId).toBe("anon-1");
    expect(data.sessionId).toBe("session-1");
    expect(data.path).toBe("/players/handle");
    expect(data.referrer).toBe("https://example.com");
  });

  it("profile_viewはpropsのfromを実カラムへ昇格し、propsから取り除く", () => {
    const result = createAnalyticsEvent(buildInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.value.toPersistence();
    expect(data.from).toBe("announce");
    expect(data.props).toBeNull();
  });

  it("profile_view以外はfromをnullのまま扱う", () => {
    const result = createAnalyticsEvent(
      buildInput({
        eventType: "story_scroll",
        props: { depth: 50 },
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.value.toPersistence();
    expect(data.from).toBeNull();
    expect(data.props).toEqual({ depth: 50 });
  });

  it("propsが空オブジェクトならnullとして保存する", () => {
    const result = createAnalyticsEvent(
      buildInput({ eventType: "story_expand", props: {} }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.toPersistence().props).toBeNull();
  });

  it("artistIdがnullのイベント（invite系）を作成できる", () => {
    const result = createAnalyticsEvent(
      buildInput({
        eventType: "invite_open",
        artistId: null,
        props: { inviterArtistId: "artist-2" },
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.value.toPersistence();
    expect(data.artistId).toBeNull();
    expect(data.props).toEqual({ inviterArtistId: "artist-2" });
  });

  it("未知のeventTypeはInvalidEventTypeFormatErrorをerrで返す", () => {
    const result = createAnalyticsEvent(
      buildInput({ eventType: "unknown_event" }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.type).toBe("InvalidEventTypeFormatError");
  });

  it("occurredAtを現在時刻として設定する", () => {
    const before = new Date();
    const result = createAnalyticsEvent(buildInput());
    const after = new Date();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { occurredAt } = result.value.toPersistence();
    expect(occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
