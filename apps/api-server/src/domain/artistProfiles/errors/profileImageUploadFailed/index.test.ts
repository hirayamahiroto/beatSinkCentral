import { describe, it, expect } from "vitest";
import { createProfileImageUploadFailedError } from "./index";

describe("ProfileImageUploadFailedError", () => {
  it("type と失敗理由を持つ Error を生成する", () => {
    const error = createProfileImageUploadFailedError("Bucket not found");

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("ProfileImageUploadFailedError");
    expect(error.reason).toBe("Bucket not found");
  });
});
