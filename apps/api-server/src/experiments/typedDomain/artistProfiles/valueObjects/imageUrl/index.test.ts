import { describe, it, expect } from "vitest";
import { createImageUrl, type ImageUrl } from "./index";
import { createSnsUrl } from "../snsUrl";

describe("createImageUrl", () => {
  it("正当なURLなら ok(ImageUrl) を返す", () => {
    const result = createImageUrl("https://cdn.example.com/a.png");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value._tag).toBe("ImageUrl");
    }
  });

  it("URL形式でないなら err を返す", () => {
    expect(createImageUrl("nope").ok).toBe(false);
  });

  it("SnsUrl は ImageUrl に代入できない（同じ形でもブランドで弾く）", () => {
    const sns = createSnsUrl("https://x.com/a");
    if (sns.ok) {
      // @ts-expect-error SnsUrl と ImageUrl は _tag が異なる
      const _img: ImageUrl = sns.value;
      void _img;
    }
  });
});
