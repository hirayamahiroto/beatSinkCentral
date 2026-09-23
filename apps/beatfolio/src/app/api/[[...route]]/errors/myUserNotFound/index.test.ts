import { describe, it, expect } from "vitest";
import { createMyUserNotFoundError } from "./index";

describe("createMyUserNotFoundError", () => {
  it("type が MyUserNotFoundError の Error を作る", () => {
    const error = createMyUserNotFoundError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("MyUserNotFoundError");
    expect(error.message).toBe("MyUserNotFoundError");
  });
});
