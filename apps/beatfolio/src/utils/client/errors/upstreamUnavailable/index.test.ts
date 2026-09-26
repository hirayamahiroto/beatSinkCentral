import { describe, it, expect } from "vitest";
import { createUpstreamUnavailableError } from "./index";

describe("upstreamUnavailable", () => {
  it("type を持つ Error を生成する", () => {
    const error = createUpstreamUnavailableError(new TypeError("fetch failed"));

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("UpstreamUnavailableError");
  });

  it("原因となったエラーを cause に保持する", () => {
    const cause = new TypeError("fetch failed");

    expect(createUpstreamUnavailableError(cause).cause).toBe(cause);
  });
});
