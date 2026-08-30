import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveMyArtistId } from "./index";

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

describe("resolveMyArtistId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("登録済みで artist があれば artistId を返す", async () => {
    meGet.mockResolvedValue(
      jsonResponse({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: { artistId: "artist-1", accountId: "saku", hasProfile: true },
      }),
    );

    await expect(resolveMyArtistId(apiClient)).resolves.toBe("artist-1");
  });

  it("未登録なら MyArtistNotFoundError を投げる", async () => {
    meGet.mockResolvedValue(jsonResponse({ registered: false }));

    await expect(resolveMyArtistId(apiClient)).rejects.toMatchObject({
      type: "MyArtistNotFoundError",
    });
  });

  it("登録済みでも artist が無ければ MyArtistNotFoundError を投げる", async () => {
    meGet.mockResolvedValue(
      jsonResponse({
        registered: true,
        userId: "user-1",
        email: "saku@example.com",
        artist: null,
      }),
    );

    await expect(resolveMyArtistId(apiClient)).rejects.toMatchObject({
      type: "MyArtistNotFoundError",
    });
  });

  it("users/me が 5xx なら UpstreamServerError を投げる", async () => {
    meGet.mockResolvedValue(
      jsonResponse({ error: "Internal" }, { ok: false, status: 500 }),
    );

    await expect(resolveMyArtistId(apiClient)).rejects.toMatchObject({
      type: "UpstreamServerError",
    });
  });

  it("users/me が 4xx なら UpstreamRejectedError を投げる", async () => {
    meGet.mockResolvedValue(
      jsonResponse(
        { error: "Unauthorized", code: "UnauthorizedError" },
        { ok: false, status: 401 },
      ),
    );

    await expect(resolveMyArtistId(apiClient)).rejects.toMatchObject({
      type: "UpstreamRejectedError",
      status: 401,
    });
  });
});
