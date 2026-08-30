import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBeatfolioBffServerClient } from "./index";

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("../../config", () => ({
  beatfolioBffConfig: { baseUrl: "http://beatfolio.test" },
}));

const requestHeaders = (init: RequestInit | undefined) =>
  new Headers(init?.headers);

describe("createBeatfolioBffServerClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("受信リクエストの cookie を自分の BFF への呼び出しへ引き継ぐ", async () => {
    headersMock.mockResolvedValue(new Headers({ cookie: "appSession=abc" }));
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);

    const client = await createBeatfolioBffServerClient();
    await client.api.dashboard.$get();

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://beatfolio.test/api/dashboard");
    expect(requestHeaders(init).get("cookie")).toBe("appSession=abc");
  });

  it("cookie が無ければヘッダを付けない", async () => {
    headersMock.mockResolvedValue(new Headers());
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);

    const client = await createBeatfolioBffServerClient();
    await client.api.players.$get();

    const [, init] = fetchMock.mock.calls[0];
    expect(requestHeaders(init).get("cookie")).toBeNull();
  });
});
