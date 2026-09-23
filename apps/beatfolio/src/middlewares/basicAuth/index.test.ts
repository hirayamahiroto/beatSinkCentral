import { describe, it, expect, vi, afterEach } from "vitest";
import { Hono } from "hono";
import { basicAuthMiddleware } from "./index";

const createApp = () =>
  new Hono().use("*", basicAuthMiddleware).get("/", (c) => c.text("ok"));

const enableBasicAuth = () => {
  vi.stubEnv("ENABLE_BASIC_AUTH", "true");
  vi.stubEnv("BASIC_AUTH_USERNAME", "staff");
  vi.stubEnv("BASIC_AUTH_PASSWORD", "s3cret");
};

const credentials = (username: string, password: string) =>
  `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

describe("basicAuthMiddleware", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("ENABLE_BASIC_AUTH が true でなければ認証せず通す", async () => {
    vi.stubEnv("ENABLE_BASIC_AUTH", "false");
    vi.stubEnv("BASIC_AUTH_USERNAME", "staff");
    vi.stubEnv("BASIC_AUTH_PASSWORD", "s3cret");

    const res = await createApp().request("/");

    expect(res.status).toBe(200);
  });

  it("有効でも資格情報の環境変数が欠けていれば認証せず通す", async () => {
    vi.stubEnv("ENABLE_BASIC_AUTH", "true");
    vi.stubEnv("BASIC_AUTH_USERNAME", "staff");
    vi.stubEnv("BASIC_AUTH_PASSWORD", "");

    const res = await createApp().request("/");

    expect(res.status).toBe(200);
  });

  it("有効で Authorization ヘッダが無ければ 401 と WWW-Authenticate を返す", async () => {
    enableBasicAuth();

    const res = await createApp().request("/");

    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toBe(
      'Basic realm="Secure Area"',
    );
    expect(await res.json()).toStrictEqual({ error: "Basic Auth Required" });
  });

  it("資格情報が一致しなければ 401 を返す", async () => {
    enableBasicAuth();

    const res = await createApp().request("/", {
      headers: { authorization: credentials("staff", "wrong") },
    });

    expect(res.status).toBe(401);
  });

  it("資格情報が一致すれば後続へ通す", async () => {
    enableBasicAuth();

    const res = await createApp().request("/", {
      headers: { authorization: credentials("staff", "s3cret") },
    });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });
});
