import { describe, it, expect } from "vitest";
import { createProfileImageUploadFailedError } from "./index";

describe("ProfileImageUploadFailedError", () => {
  it("type に ProfileImageUploadFailedError を持つ Error を生成する", () => {
    const error = createProfileImageUploadFailedError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("ProfileImageUploadFailedError");
  });
});
