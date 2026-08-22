import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveMyUserId } from "./index";

const meGet = vi.fn();

const apiClient = {
  api: { users: { me: { $get: meGet } } },
};

const jsonResponse = (
  body: unknown,
  init: { ok?: boolean; status?: number } = {},
) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  json: async () => body,
});

describe("resolveMyUserId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("登録済みなら userId を返す", async () => {
    meGet.mockResolvedValue(
      jsonResponse({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: null,
      }),
    );

    const result = await resolveMyUserId(apiClient);

    expect(result).toStrictEqual({ ok: true, userId: "user-1" });
  });

  it("未登録なら 404 を返す", async () => {
    meGet.mockResolvedValue(jsonResponse({ registered: false }));

    const result = await resolveMyUserId(apiClient);

    expect(result).toStrictEqual({
      ok: false,
      status: 404,
      body: { error: "User not found" },
    });
  });

  it("users/me の取得に失敗したら 502 を返す", async () => {
    meGet.mockResolvedValue(
      jsonResponse({ error: "Internal" }, { ok: false, status: 500 }),
    );

    const result = await resolveMyUserId(apiClient);

    expect(result).toStrictEqual({
      ok: false,
      status: 502,
      body: { error: "Failed to resolve user" },
    });
  });
});
