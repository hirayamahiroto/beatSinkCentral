import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  createInvalidRequestFormatError,
  isInvalidRequestFormatError,
} from "./index";

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

describe("isInvalidRequestFormatError", () => {
  it("InvalidRequestFormatError を判別できる", () => {
    const error = createInvalidRequestFormatError(buildIssues());

    expect(isInvalidRequestFormatError(error)).toBe(true);
  });

  it("素の Error は false を返す", () => {
    expect(isInvalidRequestFormatError(new Error("boom"))).toBe(false);
  });

  it("type が異なる Error は false を返す", () => {
    const other = Object.assign(new Error("other"), {
      type: "OtherError" as const,
    });

    expect(isInvalidRequestFormatError(other)).toBe(false);
  });

  it("Error 以外の値は false を返す", () => {
    expect(isInvalidRequestFormatError("string")).toBe(false);
    expect(isInvalidRequestFormatError(null)).toBe(false);
    expect(isInvalidRequestFormatError(undefined)).toBe(false);
  });
});
