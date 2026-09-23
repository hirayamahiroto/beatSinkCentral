import { describe, it, expect } from "vitest";
import { createUpstreamServerError } from "./index";

describe("createUpstreamServerError", () => {
  it("上流の 5xx ステータスを保持する Error を作る", () => {
    const error = createUpstreamServerError(503);

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("UpstreamServerError");
    expect(error.upstreamStatus).toBe(503);
  });
});
