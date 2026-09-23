import { describe, it, expect } from "vitest";
import { createUpstreamContractViolationError } from "./index";

describe("createUpstreamContractViolationError", () => {
  it("上流のステータスと違反理由を保持する Error を作る", () => {
    const error = createUpstreamContractViolationError({
      upstreamStatus: 200,
      reason: "unparsable body",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("UpstreamContractViolationError");
    expect(error.upstreamStatus).toBe(200);
    expect(error.reason).toBe("unparsable body");
  });
});
