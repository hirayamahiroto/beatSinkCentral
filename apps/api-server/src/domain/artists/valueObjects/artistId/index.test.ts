import { describe, it, expect } from "vitest";
import { createArtistId } from "./index";

describe("createArtistId", () => {
  it("有効な値でArtistIdを生成する", () => {
    expect(createArtistId("artist-123").value).toBe("artist-123");
  });

  it("前後の空白をトリムする", () => {
    expect(createArtistId("  artist-123  ").value).toBe("artist-123");
  });

  it("空文字でエラー", () => {
    expect(() => createArtistId("")).toThrow();
  });

  it("空白のみでエラー", () => {
    expect(() => createArtistId("   ")).toThrow();
  });
});
