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

    await expect(resolveMyUserId(apiClient)).resolves.toBe("user-1");
  });

  it("未登録なら MyUserNotFoundError を投げる", async () => {
    meGet.mockResolvedValue(jsonResponse({ registered: false }));

    await expect(resolveMyUserId(apiClient)).rejects.toMatchObject({
      type: "MyUserNotFoundError",
    });
  });

  it("users/me が 5xx なら UpstreamServerError を投げる", async () => {
    meGet.mockResolvedValue(
      jsonResponse({ error: "Internal" }, { ok: false, status: 500 }),
    );

    await expect(resolveMyUserId(apiClient)).rejects.toMatchObject({
      type: "UpstreamServerError",
    });
  });
});
