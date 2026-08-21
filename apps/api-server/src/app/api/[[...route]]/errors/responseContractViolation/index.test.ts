import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createResponseContractViolationError } from "./index";

const buildIssues = () => {
  const schema = z.object({ accountId: z.string() });
  const result = schema.safeParse({ accountId: 1 });
  if (result.success) {
    throw new Error("test setup: schema should have failed");
  }
  return result.error.issues;
};

describe("ResponseContractViolationError", () => {
  it("type と issues を保持した Error を生成する", () => {
    const issues = buildIssues();

    const error = createResponseContractViolationError(issues);

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("ResponseContractViolationError");
    expect(error.issues).toStrictEqual(issues);
  });

  it("message に type 名が入る", () => {
    const error = createResponseContractViolationError(buildIssues());

    expect(error.message).toBe("ResponseContractViolationError");
  });
});
