import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createInvalidRequestFormatError } from "./index";

const buildIssues = () => {
  const schema = z.object({ email: z.string().min(1) });
  const result = schema.safeParse({ email: "" });
  if (result.success) {
    throw new Error("test setup: schema should have failed");
  }
  return result.error.issues;
};

describe("InvalidRequestFormatError", () => {
  it("type と issues を保持した Error を生成する", () => {
    const issues = buildIssues();

    const error = createInvalidRequestFormatError(issues);

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("InvalidRequestFormatError");
    expect(error.issues).toStrictEqual(issues);
  });

  it("message に type 名が入る", () => {
    const error = createInvalidRequestFormatError(buildIssues());

    expect(error.message).toBe("InvalidRequestFormatError");
  });
});
