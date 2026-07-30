import { describe, it, expect } from "vitest";
import { createArtistId } from "./index";

describe("createArtistId", () => {
  it("有効な値でArtistIdを生成する", () => {
    const result = createArtistId("artist-123");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("artist-123");
    }
  });

  it("前後の空白をトリムする", () => {
    const result = createArtistId("  artist-123  ");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("artist-123");
    }
  });

  it("空文字で err", () => {
    expect(createArtistId("").ok).toBe(false);
  });

  it("空白のみで err", () => {
    expect(createArtistId("   ").ok).toBe(false);
  });
});
