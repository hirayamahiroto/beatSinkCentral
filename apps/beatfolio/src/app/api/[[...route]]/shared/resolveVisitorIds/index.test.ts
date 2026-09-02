import { describe, it, expect } from "vitest";
import { resolveVisitorIds } from "./index";

describe("resolveVisitorIds", () => {
  it("両方のCookieが既存なら、そのまま返す", () => {
    const result = resolveVisitorIds({
      anonId: "anon-existing",
      sessionId: "session-existing",
    });

    expect(result).toEqual({
      anonId: "anon-existing",
      sessionId: "session-existing",
    });
  });

  it("anonIdが未設定なら新しく生成する", () => {
    const result = resolveVisitorIds(
      { anonId: undefined, sessionId: "session-existing" },
      () => "generated-id",
    );

    expect(result).toEqual({
      anonId: "generated-id",
      sessionId: "session-existing",
    });
  });

  it("sessionIdが未設定（非アクティブでローテーション含む）なら新しく生成する", () => {
    const result = resolveVisitorIds(
      { anonId: "anon-existing", sessionId: undefined },
      () => "generated-id",
    );

    expect(result).toEqual({
      anonId: "anon-existing",
      sessionId: "generated-id",
    });
  });

  it("両方未設定なら、それぞれ独立に生成する", () => {
    let call = 0;
    const generateId = () => `generated-${++call}`;

    const result = resolveVisitorIds(
      { anonId: undefined, sessionId: undefined },
      generateId,
    );

    expect(result).toEqual({
      anonId: "generated-1",
      sessionId: "generated-2",
    });
  });

  it("generateIdを省略するとcrypto.randomUUIDでUUID形式のidを生成する", () => {
    const result = resolveVisitorIds({
      anonId: undefined,
      sessionId: undefined,
    });

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(result.anonId).toMatch(uuidPattern);
    expect(result.sessionId).toMatch(uuidPattern);
  });
});
