import { describe, it, expect } from "vitest";
import { createProfileName, type ProfileName } from "./index";
import { createTagline } from "../tagline";

describe("createProfileName", () => {
  it("正当なら ok(ProfileName) を返す", () => {
    const result = createProfileName(" Beatboxer ");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("Beatboxer");
      expect(result.value._tag).toBe("ProfileName");
    }
  });

  it("空なら err を返す（throw しない）", () => {
    const result = createProfileName("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidProfileNameFormatError");
    }
  });

  it("256文字以上なら err を返す", () => {
    expect(createProfileName("a".repeat(256)).ok).toBe(false);
  });

  it("Tagline は ProfileName に代入できない（ブランドで弾く）", () => {
    const tagline = createTagline("hello");
    if (tagline.ok) {
      // @ts-expect-error Tagline と ProfileName は _tag が異なる
      const _name: ProfileName = tagline.value;
      void _name;
    }
  });
});
