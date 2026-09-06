import { describe, it, expect } from "vitest";
import { createUserAlreadyRegisteredError } from "./index";

describe("UserAlreadyRegisteredError", () => {
  it("type に UserAlreadyRegisteredError を持つ Error を生成する", () => {
    const error = createUserAlreadyRegisteredError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("UserAlreadyRegisteredError");
  });
});
