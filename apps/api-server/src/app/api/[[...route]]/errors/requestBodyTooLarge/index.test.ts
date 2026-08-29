import { describe, it, expect } from "vitest";
import { createRequestBodyTooLargeError } from "./index";

describe("RequestBodyTooLargeError", () => {
  it("type を保持した Error を生成する", () => {
    const error = createRequestBodyTooLargeError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("RequestBodyTooLargeError");
  });

  it("message に type 名が入る", () => {
    const error = createRequestBodyTooLargeError();

    expect(error.message).toBe("RequestBodyTooLargeError");
  });
});
