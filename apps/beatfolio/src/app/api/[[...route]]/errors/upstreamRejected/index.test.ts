import { describe, it, expect } from "vitest";
import { createUpstreamRejectedError } from "./index";

describe("createUpstreamRejectedError", () => {
  it("上流の 4xx ステータスとエラーボディを保持する Error を作る", () => {
    const body = {
      error: "Handle already taken",
      code: "HandleAlreadyTakenError",
      details: { handle: "saku" },
    };

    const error = createUpstreamRejectedError({ status: 409, body });

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("UpstreamRejectedError");
    expect(error.status).toBe(409);
    expect(error.body).toBe(body);
  });
});
