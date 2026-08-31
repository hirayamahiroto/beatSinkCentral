import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createBeatfolioBffServerClient,
  isCookieForwardableBaseUrl,
} from "./index";
import { beatfolioBffConfig } from "../../config";

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("../../config", () => ({
  beatfolioBffConfig: { baseUrl: "https://beatfolio.test" },
}));

const requestHeaders = (init: RequestInit | undefined) =>
  new Headers(init?.headers);

describe("createBeatfolioBffServerClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    beatfolioBffConfig.baseUrl = "https://beatfolio.test";
  });

  it("受信リクエストの cookie を自分の BFF への呼び出しへ引き継ぐ", async () => {
    headersMock.mockResolvedValue(new Headers({ cookie: "appSession=abc" }));
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);

    const client = await createBeatfolioBffServerClient();
    await client.api.dashboard.$get();

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://beatfolio.test/api/dashboard");
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

  it("リダイレクトを追従しない設定で fetch する", async () => {
    headersMock.mockResolvedValue(new Headers({ cookie: "appSession=abc" }));
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);

    const client = await createBeatfolioBffServerClient();
    await client.api.dashboard.$get();

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.redirect).toBe("manual");
  });

  it("https でも localhost でもない baseUrl では cookie を送らず throw する", async () => {
    beatfolioBffConfig.baseUrl = "http://beatfolio.test";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(createBeatfolioBffServerClient()).rejects.toMatchObject({
      type: "InsecureBffBaseUrlError",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ローカル開発の http://localhost は許可する", async () => {
    beatfolioBffConfig.baseUrl = "http://localhost:3000";
    headersMock.mockResolvedValue(new Headers({ cookie: "appSession=abc" }));
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);

    const client = await createBeatfolioBffServerClient();
    await client.api.dashboard.$get();

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://localhost:3000/api/dashboard");
  });
});

describe("isCookieForwardableBaseUrl", () => {
  it("https の URL を許可する", () => {
    expect(isCookieForwardableBaseUrl("https://beatfolio.example.com")).toBe(
      true,
    );
  });

  it("localhost 系ホストの http を許可する", () => {
    expect(isCookieForwardableBaseUrl("http://localhost:3000")).toBe(true);
    expect(isCookieForwardableBaseUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isCookieForwardableBaseUrl("http://[::1]:3000")).toBe(true);
  });

  it("localhost 以外の http を拒否する", () => {
    expect(isCookieForwardableBaseUrl("http://beatfolio.example.com")).toBe(
      false,
    );
  });

  it("URL として不正な文字列を拒否する", () => {
    expect(isCookieForwardableBaseUrl("")).toBe(false);
    expect(isCookieForwardableBaseUrl("beatfolio.example.com")).toBe(false);
  });
});
