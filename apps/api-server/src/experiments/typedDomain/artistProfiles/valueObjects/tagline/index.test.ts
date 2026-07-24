import { describe, it, expect } from "vitest";
import { createTagline } from "./index";

describe("createTagline", () => {
  it("正当なら ok(Tagline) を返す", () => {
    const result = createTagline("The loop master");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("The loop master");
      expect(result.value._tag).toBe("Tagline");
    }
  });

  it("空なら err を返す", () => {
    const result = createTagline("");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidTaglineFormatError");
    }
  });

  it("256文字以上なら err を返す", () => {
    expect(createTagline("a".repeat(256)).ok).toBe(false);
  });
});
