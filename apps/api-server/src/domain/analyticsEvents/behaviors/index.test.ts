import { describe, it, expect } from "vitest";
import { createAnalyticsEventBehaviors } from "./index";
import type { AnalyticsEventState } from "../entities";

const buildState = (
  overrides: Partial<AnalyticsEventState> = {},
): AnalyticsEventState => ({
  id: "event-1",
  eventType: { value: "profile_view" },
  artistId: "artist-1",
  anonId: "anon-1",
  sessionId: "session-1",
  path: "/players/handle",
  referrer: "https://example.com",
  from: "announce",
  props: null,
  occurredAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

describe("createAnalyticsEventBehaviors", () => {
  it("getIdでidを返す", () => {
    const event = createAnalyticsEventBehaviors(buildState({ id: "event-2" }));

    expect(event.getId()).toBe("event-2");
  });

  it("toPersistenceで永続化用データを返す", () => {
    const state = buildState({
      props: { depth: 50 },
      from: null,
    });
    const event = createAnalyticsEventBehaviors(state);

    expect(event.toPersistence()).toEqual({
      id: state.id,
      eventType: "profile_view",
      artistId: state.artistId,
      anonId: state.anonId,
      sessionId: state.sessionId,
      path: state.path,
      referrer: state.referrer,
      from: null,
      props: { depth: 50 },
      occurredAt: state.occurredAt,
    });
  });
});
