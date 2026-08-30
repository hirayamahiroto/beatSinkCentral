import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

const { getSessionFromRequest, handleAuthRequest } = vi.hoisted(() => ({
  getSessionFromRequest: vi.fn(),
  handleAuthRequest: vi.fn(),
}));

vi.mock("./libs/auth0", () => ({
  getSessionFromRequest,
  handleAuthRequest,
  getSession: vi.fn(),
}));

const passThroughWithCookie = () => {
  const res = NextResponse.next();
  res.headers.set("set-cookie", "appSession=rolled; Path=/");
  return res;
};

const request = async (path: string) => {
  const { middleware } = await import("./middleware");
  return middleware(new Request(`http://localhost${path}`));
};

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handleAuthRequest.mockResolvedValue(passThroughWithCookie());
  });

  describe("セッション必須パス", () => {
    it.each([
      "/dashboard",
      "/dashboard/settings",
      "/dashboard/profile/edit",
      "/onboarding",
    ])(
      "%s はセッションが無ければ /auth/login へ redirect する",
      async (path) => {
        getSessionFromRequest.mockResolvedValue(null);

        const res = await request(path);

        expect(res.status).toBe(307);
        expect(res.headers.get("location")).toBe("http://localhost/auth/login");
      },
    );

    it("セッションがあれば通し、Auth0 が付けた Set-Cookie を保持する", async () => {
      getSessionFromRequest.mockResolvedValue({ user: { sub: "auth0|1" } });

      const res = await request("/dashboard/settings");

      expect(res.status).toBe(200);
      expect(res.headers.get("set-cookie")).toBe("appSession=rolled; Path=/");
    });
  });

  describe("公開パス", () => {
    it.each(["/", "/players", "/players/saku", "/about"])(
      "%s はセッションが無くても通す",
      async (path) => {
        getSessionFromRequest.mockResolvedValue(null);

        const res = await request(path);

        expect(res.status).toBe(200);
        expect(getSessionFromRequest).not.toHaveBeenCalled();
      },
    );
  });

  describe("Auth0 が処理する応答", () => {
    it("/auth/* は Auth0 の応答をそのまま返す", async () => {
      const authRedirect = NextResponse.redirect(
        "https://tenant.auth0.com/authorize",
      );
      handleAuthRequest.mockResolvedValue(authRedirect);

      const res = await request("/auth/login");

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(
        "https://tenant.auth0.com/authorize",
      );
      expect(getSessionFromRequest).not.toHaveBeenCalled();
    });

    it("Auth0 がリダイレクトを返したら後続を実行せずそのまま返す", async () => {
      handleAuthRequest.mockResolvedValue(
        NextResponse.redirect(
          "http://localhost/auth/login?returnTo=%2Fdashboard",
        ),
      );

      const res = await request("/dashboard");

      expect(res.status).toBe(307);
      expect(getSessionFromRequest).not.toHaveBeenCalled();
    });
  });
});
