import { describe, it, expect, afterEach, vi } from "vitest";
import { Hono } from "hono";
import { handleRequestError } from "../../errorMap";
import { basicAuthMiddleware, readBasicAuthCredentials } from "./index";

const USERNAME = "user";
const PASSWORD = "pass";

const enableBasicAuth = (password: string = PASSWORD) => {
  vi.stubEnv("ENABLE_BASIC_AUTH", "true");
  vi.stubEnv("BASIC_AUTH_USERNAME", USERNAME);
  vi.stubEnv("BASIC_AUTH_PASSWORD", password);
};

const buildApp = () =>
  new Hono()
    .use("*", basicAuthMiddleware)
    .get("/", (c) => c.json({ ok: true }))
    .onError(handleRequestError);

const basicHeader = (username: string, password: string) =>
  `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

describe("readBasicAuthCredentials", () => {
  it("ENABLE_BASIC_AUTH が true 以外なら null を返す", () => {
    expect(
      readBasicAuthCredentials({
        ENABLE_BASIC_AUTH: "false",
        BASIC_AUTH_USERNAME: USERNAME,
        BASIC_AUTH_PASSWORD: PASSWORD,
      }),
    ).toBeNull();
  });

  it("ユーザー名が未設定なら null を返す", () => {
    expect(
      readBasicAuthCredentials({
        ENABLE_BASIC_AUTH: "true",
        BASIC_AUTH_PASSWORD: PASSWORD,
      }),
    ).toBeNull();
  });

  it("パスワードが未設定なら null を返す", () => {
    expect(
      readBasicAuthCredentials({
        ENABLE_BASIC_AUTH: "true",
        BASIC_AUTH_USERNAME: USERNAME,
      }),
    ).toBeNull();
  });

  it("有効かつ両方設定済みなら認証情報を返す", () => {
    expect(
      readBasicAuthCredentials({
        ENABLE_BASIC_AUTH: "true",
        BASIC_AUTH_USERNAME: USERNAME,
        BASIC_AUTH_PASSWORD: PASSWORD,
      }),
    ).toStrictEqual({ username: USERNAME, password: PASSWORD });
  });
});

describe("basicAuthMiddleware", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("Basic 認証が無効な場合は認証なしで通過する", async () => {
    vi.stubEnv("ENABLE_BASIC_AUTH", "false");

    const res = await buildApp().request("/");

    expect(res.status).toBe(200);
  });

  it("有効かつ Authorization ヘッダが無い場合は 401 を返す", async () => {
    enableBasicAuth();

    const res = await buildApp().request("/");

    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toBe(
      'Basic realm="Secure Area"',
    );
    expect(await res.json()).toStrictEqual({ error: "Basic Auth Required" });
  });

  it("正しい認証情報なら通過する", async () => {
    enableBasicAuth();

    const res = await buildApp().request("/", {
      headers: { Authorization: basicHeader(USERNAME, PASSWORD) },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({ ok: true });
  });

  it("誤った認証情報なら 401 を返す", async () => {
    enableBasicAuth();

    const res = await buildApp().request("/", {
      headers: { Authorization: basicHeader(USERNAME, "wrong") },
    });

    expect(res.status).toBe(401);
  });

  it("値の無い Basic ヘッダでも 500 にならず 401 を返す", async () => {
    enableBasicAuth();

    const res = await buildApp().request("/", {
      headers: { Authorization: "Basic" },
    });

    expect(res.status).toBe(401);
  });

  it("Basic 以外の scheme は受け付けない", async () => {
    enableBasicAuth();

    const res = await buildApp().request("/", {
      headers: {
        Authorization: `Bearer ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64")}`,
      },
    });

    expect(res.status).toBe(401);
  });

  it("コロンを含むパスワードでも認証できる", async () => {
    const password = "pa:ss:word";
    enableBasicAuth(password);

    const res = await buildApp().request("/", {
      headers: { Authorization: basicHeader(USERNAME, password) },
    });

    expect(res.status).toBe(200);
  });
});
