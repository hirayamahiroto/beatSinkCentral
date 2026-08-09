import { describe, it, expect } from "vitest";
import {
  createUpstreamUnavailableError,
  isUpstreamUnavailableError,
} from "./index";

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

  it("自身の型を判別できる", () => {
    expect(
      isUpstreamUnavailableError(createUpstreamUnavailableError(new Error())),
    ).toBe(true);
  });

  it("他のエラーを誤判定しない", () => {
    expect(isUpstreamUnavailableError(new Error("boom"))).toBe(false);
    expect(
      isUpstreamUnavailableError({ type: "UpstreamUnavailableError" }),
    ).toBe(false);
    expect(isUpstreamUnavailableError(undefined)).toBe(false);
  });
});
