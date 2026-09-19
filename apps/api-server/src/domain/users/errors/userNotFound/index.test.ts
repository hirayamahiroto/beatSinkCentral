import { describe, it, expect } from "vitest";
import { createUserNotFoundError } from "./index";

describe("UserNotFoundError", () => {
  it("type に UserNotFoundError を持つ Error を生成する", () => {
    const error = createUserNotFoundError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("UserNotFoundError");
  });
});
