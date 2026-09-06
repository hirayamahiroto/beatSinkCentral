import { describe, it, expect } from "vitest";
import { createUnauthorizedError } from "./index";

describe("UnauthorizedError", () => {
  it("type を保持した Error を生成する", () => {
    const error = createUnauthorizedError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("UnauthorizedError");
  });

  it("message に type 名が入る", () => {
    const error = createUnauthorizedError();

    expect(error.message).toBe("UnauthorizedError");
  });
});
