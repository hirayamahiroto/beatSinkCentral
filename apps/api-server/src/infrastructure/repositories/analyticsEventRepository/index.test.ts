import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAnalyticsEventWriter } from "./index";
import type { AnalyticsEventPersistenceData } from "../../../domain/analyticsEvents/entities";

const createExecutor = () => ({
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue(undefined),
});

const buildData = (
  overrides: Partial<AnalyticsEventPersistenceData> = {},
): AnalyticsEventPersistenceData => ({
  id: "event-1",
  eventType: "profile_view",
  artistId: "artist-1",
  anonId: "anon-1",
  sessionId: "session-1",
  path: "/players/handle",
  referrer: null,
  from: "announce",
  props: null,
  occurredAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

describe("createAnalyticsEventWriter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("生成時に渡したexecutorでinsertする", async () => {
    const executor = createExecutor();
    const data = buildData();

    await createAnalyticsEventWriter(executor as never).record(data);

    expect(executor.insert).toHaveBeenCalledTimes(1);
    expect(executor.values).toHaveBeenCalledWith(data);
  });

  it("何も返さない（fire-and-forget）", async () => {
    const executor = createExecutor();

    const result = await createAnalyticsEventWriter(executor as never).record(
      buildData(),
    );

    expect(result).toBeUndefined();
  });
});
