import { describe, it, expect } from "vitest";
import { createMalformedRequestBodyError } from "./index";

describe("MalformedRequestBodyError", () => {
  it("type を保持した Error を生成する", () => {
    const error = createMalformedRequestBodyError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("MalformedRequestBodyError");
  });

  it("message に type 名が入る", () => {
    const error = createMalformedRequestBodyError();

    expect(error.message).toBe("MalformedRequestBodyError");
  });
});
