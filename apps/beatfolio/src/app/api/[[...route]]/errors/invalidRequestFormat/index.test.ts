import { describe, it, expect } from "vitest";
import type { ZodIssue } from "zod";
import { createInvalidRequestFormatError } from "./index";

describe("createInvalidRequestFormatError", () => {
  it("zod の issues をそのまま保持する Error を作る", () => {
    const issues: ZodIssue[] = [
      {
        code: "invalid_type",
        expected: "string",
        received: "undefined",
        path: ["handle"],
        message: "Required",
      },
    ];

    const error = createInvalidRequestFormatError(issues);

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("InvalidRequestFormatError");
    expect(error.issues).toBe(issues);
  });
});
