import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import {
  requestContextMiddleware,
  type RequestContextEnv,
} from "../../../../../middlewares/requestContext";
import createUser from "./index";
import { handleBffError } from "../../../../../errorMap";
import {
  createEndpointMock,
  upstreamJsonResponse,
  upstreamMalformedJsonResponse,
  type ApiServerClient,
  type ApiServerClientMock,
} from "../../../../../utils/client/testDoubles";

const usersPost =
  createEndpointMock<ApiServerClient["api"]["users"]["$post"]>();

const apiServerClient = {
  api: { users: { $post: usersPost } },
} satisfies ApiServerClientMock;

vi.mock("../../../../../utils/client", () => ({
  createApiServerClient: () => apiServerClient,
}));

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", requestContextMiddleware);
  app.route("/", createUser);
  app.onError(handleBffError);
  return app;
};

const request = (body: unknown) =>
  createApp().request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const validBody = { handle: "saku", email: "saku@example.com" };

describe("POST /users", () => {
  beforeEach(() => vi.clearAllMocks());

  it("handle と email を api-server の登録 API へ渡し、返った userId / artistId を 201 で返す", async () => {
    usersPost.mockResolvedValue(
      upstreamJsonResponse({ userId: "user-1", artistId: "artist-1" }, 201),
    );

    const res = await request(validBody);

    expect(res.status).toBe(201);
    expect(await res.json()).toStrictEqual({
      userId: "user-1",
      artistId: "artist-1",
    });
    expect(usersPost).toHaveBeenCalledExactlyOnceWith({
      json: { handle: "saku", email: "saku@example.com" },
    });
  });

  it("email の書式が不正なら上流を呼ばず 400 を返す", async () => {
    const res = await request({ handle: "saku", email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      code: "InvalidRequestFormatError",
    });
    expect(usersPost).not.toHaveBeenCalled();
  });

  it("handle が空なら上流を呼ばず 400 を返す", async () => {
    const res = await request({ handle: "", email: "saku@example.com" });

    expect(res.status).toBe(400);
    expect(usersPost).not.toHaveBeenCalled();
  });

  it("api-server の 4xx はステータスとボディを透過する", async () => {
    usersPost.mockResolvedValue(
      upstreamJsonResponse(
        { error: "Handle already taken", code: "HandleAlreadyTakenError" },
        409,
      ),
    );

    const res = await request(validBody);

    expect(res.status).toBe(409);
    expect(await res.json()).toStrictEqual({
      error: "Handle already taken",
      code: "HandleAlreadyTakenError",
    });
  });

  it("api-server の 5xx は 502 を返す", async () => {
    usersPost.mockResolvedValue(
      upstreamJsonResponse({ error: "Internal", code: "Internal" }, 500),
    );

    const res = await request(validBody);

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ code: "UpstreamServerError" });
  });

  it("成功応答のボディが JSON として読めなければ契約違反として 502 を返す", async () => {
    usersPost.mockResolvedValue(upstreamMalformedJsonResponse(201));

    const res = await request(validBody);

    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({
      code: "UpstreamContractViolationError",
    });
  });
});
