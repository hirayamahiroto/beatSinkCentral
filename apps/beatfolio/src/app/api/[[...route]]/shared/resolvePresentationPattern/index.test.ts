import { describe, it, expect } from "vitest";
import { resolvePresentationPattern } from "./index";

describe("resolvePresentationPattern", () => {
  it("未選択（null）は既定の interview にする", () => {
    expect(resolvePresentationPattern(null)).toBe("interview");
  });

  it("UI 実装済みのコードはそのまま返す", () => {
    expect(resolvePresentationPattern("editorial")).toBe("editorial");
  });

  it("UI 未実装のコードは上流の契約違反として throw する", () => {
    expect(() => resolvePresentationPattern("carousel")).toThrow(
      expect.objectContaining({
        type: "UpstreamContractViolationError",
        reason: "unknown presentation pattern",
      }),
    );
  });
});
