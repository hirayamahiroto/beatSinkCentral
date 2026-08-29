import { describe, it, expect } from "vitest";
import { resolveAppBaseUrl } from "./resolve";

const LOCAL = "http://localhost:3000";

describe("resolveAppBaseUrl", () => {
  it("APP_BASE_URL があれば最優先で使い、末尾スラッシュを除く", () => {
    expect(
      resolveAppBaseUrl(
        {
          APP_BASE_URL: "https://beatfolio.example.com/",
          VERCEL_BRANCH_URL: "branch.vercel.app",
          VERCEL_URL: "deploy.vercel.app",
        },
        LOCAL,
      ),
    ).toBe("https://beatfolio.example.com");
  });

  it("APP_BASE_URL が無ければ VERCEL_BRANCH_URL を https で組み立てる", () => {
    expect(
      resolveAppBaseUrl(
        {
          VERCEL_BRANCH_URL: "branch.vercel.app",
          VERCEL_URL: "deploy.vercel.app",
        },
        LOCAL,
      ),
    ).toBe("https://branch.vercel.app");
  });

  it("VERCEL_BRANCH_URL も無ければ VERCEL_URL を使う", () => {
    expect(resolveAppBaseUrl({ VERCEL_URL: "deploy.vercel.app" }, LOCAL)).toBe(
      "https://deploy.vercel.app",
    );
  });

  it("どれも無ければローカルの既定値を返す", () => {
    expect(resolveAppBaseUrl({}, LOCAL)).toBe(LOCAL);
  });

  it("空文字は未設定として扱う", () => {
    expect(resolveAppBaseUrl({ APP_BASE_URL: "", VERCEL_URL: "" }, LOCAL)).toBe(
      LOCAL,
    );
  });
});
