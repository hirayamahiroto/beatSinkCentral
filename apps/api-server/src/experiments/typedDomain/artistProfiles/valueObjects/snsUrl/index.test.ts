import { describe, it, expect } from "vitest";
import { createSnsUrl } from "./index";

describe("createSnsUrl", () => {
  it("正当なURLなら ok(SnsUrl) を返す", () => {
    const result = createSnsUrl("https://youtube.com/@artist");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value._tag).toBe("SnsUrl");
    }
  });

  it("URL形式でないなら err を返す", () => {
    const result = createSnsUrl("not-a-url");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidSnsUrlFormatError");
    }
  });
});
