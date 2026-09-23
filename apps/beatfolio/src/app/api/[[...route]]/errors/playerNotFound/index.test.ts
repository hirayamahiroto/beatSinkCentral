import { describe, it, expect } from "vitest";
import { createPlayerNotFoundError } from "./index";

describe("createPlayerNotFoundError", () => {
  it("type が PlayerNotFoundError の Error を作る", () => {
    const error = createPlayerNotFoundError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("PlayerNotFoundError");
    expect(error.message).toBe("PlayerNotFoundError");
  });
});
