import { describe, it, expect } from "vitest";
import { toUpstreamError } from "./index";

const response = (status: number, body: unknown) => ({
  status,
  json: async () => body,
});

describe("toUpstreamError", () => {
  it("5xx は UpstreamServerError にし、ボディを読まない", async () => {
    const error = await toUpstreamError({
      status: 503,
      json: async () => {
        throw new Error("should not be called");
      },
    });

    expect(error).toMatchObject({
      type: "UpstreamServerError",
      upstreamStatus: 503,
    });
  });

  it("code を持つ 4xx はステータスとボディを保持した UpstreamRejectedError にする", async () => {
    const error = await toUpstreamError(
      response(422, {
        error: "Profile is not publishable",
        code: "ProfileNotPublishableError",
        details: { missingFields: ["name"] },
      }),
    );

    expect(error).toMatchObject({
      type: "UpstreamRejectedError",
      status: 422,
      body: {
        error: "Profile is not publishable",
        code: "ProfileNotPublishableError",
        details: { missingFields: ["name"] },
      },
    });
  });

  it("code の無い 4xx は UpstreamContractViolationError にする", async () => {
    const error = await toUpstreamError(response(409, { error: "taken" }));

    expect(error).toMatchObject({
      type: "UpstreamContractViolationError",
      upstreamStatus: 409,
    });
  });

  it("ボディが解析できない 4xx は UpstreamContractViolationError にする", async () => {
    const error = await toUpstreamError({
      status: 400,
      json: async () => {
        throw new SyntaxError("Unexpected end of JSON input");
      },
    });

    expect(error).toMatchObject({
      type: "UpstreamContractViolationError",
      upstreamStatus: 400,
    });
  });

  it("4xx でも 5xx でもないステータスは UpstreamContractViolationError にする", async () => {
    const error = await toUpstreamError(response(302, {}));

    expect(error).toMatchObject({
      type: "UpstreamContractViolationError",
      upstreamStatus: 302,
    });
  });
});
