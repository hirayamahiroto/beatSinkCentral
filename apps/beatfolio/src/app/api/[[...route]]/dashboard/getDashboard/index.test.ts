import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { RequestContextEnv } from "../../../../../middlewares/requestContext";
import getDashboard from "./index";
import { handleBffError } from "../../../../../errorMap";

const meGet = vi.fn();
const profileGet = vi.fn();
const presentationPatternsGet = vi.fn();

const apiClient = {
  api: {
    users: { me: { $get: meGet } },
    artists: { ":artistId": { profile: { $get: profileGet } } },
    "presentation-patterns": { $get: presentationPatternsGet },
  },
};

const createApp = () => {
  const app = new Hono<RequestContextEnv>();
  app.use("*", async (c, next) => {
    c.set("apiClient", apiClient as never);
    await next();
  });
  app.route("/", getDashboard);
  app.onError(handleBffError);
  return app;
};

const jsonResponse = (
  body: unknown,
  init: { ok?: boolean; status?: number } = {},
) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  json: async () => body,
});

const registeredMe = {
  registered: true,
  userId: "user-1",
  email: "saku@example.com",
  artist: { artistId: "artist-1", handle: "saku", hasProfile: true },
};

const profileView = {
  attributes: {
    name: "SAKU",
    imageUrl: "https://example.com/saku.jpg",
    tagline: null,
    genres: ["Beatbox"],
    activityInfo: null,
  },
  story: { chapters: [{ key: "beginning", body: "始めたきっかけ。" }] },
  links: [{ linkTypeCode: "youtube", url: "https://youtube.com/@saku" }],
  presentation: { patternCode: "spotlight" },
  published: true,
};

const presentationPatterns = [
  { code: "interview", label: "インタビュー" },
  { code: "spotlight", label: "スポットライト" },
];

describe("GET /dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    presentationPatternsGet.mockResolvedValue(
      jsonResponse({ presentationPatterns }),
    );
  });

  it("画面に必要な公開状態と、表現パターンの現在値・選択肢を返す", async () => {
    meGet.mockResolvedValue(jsonResponse(registeredMe));
    profileGet.mockResolvedValue(
      jsonResponse({
        handle: "saku",
        profile: profileView,
        publishability: { ok: true, missingFields: [] },
      }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(profileGet).toHaveBeenCalledWith({
      param: { artistId: "artist-1" },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toStrictEqual({
      registered: true,
      artist: {
        handle: "saku",
        profile: {
          published: true,
          missingPublishRequirements: [],
          presentation: {
            patternCode: "spotlight",
            options: presentationPatterns,
          },
        },
      },
    });
  });

  it("表現パターン未選択なら公開ページと同じ既定（interview）を現在値として返す", async () => {
    meGet.mockResolvedValue(jsonResponse(registeredMe));
    profileGet.mockResolvedValue(
      jsonResponse({
        handle: "saku",
        profile: { ...profileView, presentation: { patternCode: null } },
        publishability: { ok: true, missingFields: [] },
      }),
    );

    const res = await createApp().request("/", { method: "GET" });
    const body = await res.json();

    expect(body.artist.profile.presentation.patternCode).toBe("interview");
  });

  it("公開に足りない項目は表示ラベルへ解決して返す", async () => {
    meGet.mockResolvedValue(jsonResponse(registeredMe));
    profileGet.mockResolvedValue(
      jsonResponse({
        handle: "saku",
        profile: {
          ...profileView,
          attributes: { ...profileView.attributes, imageUrl: null },
          published: false,
        },
        publishability: { ok: false, missingFields: ["imageUrl", "links"] },
      }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(await res.json()).toStrictEqual({
      registered: true,
      artist: {
        handle: "saku",
        profile: {
          published: false,
          missingPublishRequirements: ["アーティスト写真", "SNS / 配信リンク"],
          presentation: {
            patternCode: "spotlight",
            options: presentationPatterns,
          },
        },
      },
    });
  });

  it("プロフィール未作成なら profile は null で返す", async () => {
    meGet.mockResolvedValue(
      jsonResponse({
        ...registeredMe,
        artist: { ...registeredMe.artist, hasProfile: false },
      }),
    );
    profileGet.mockResolvedValue(
      jsonResponse({
        handle: "saku",
        profile: null,
        publishability: null,
      }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(await res.json()).toStrictEqual({
      registered: true,
      artist: { handle: "saku", profile: null },
    });
  });

  it("artist 未作成なら artist は null で返し、プロフィールを読まない", async () => {
    meGet.mockResolvedValue(jsonResponse({ ...registeredMe, artist: null }));

    const res = await createApp().request("/", { method: "GET" });

    expect(profileGet).not.toHaveBeenCalled();
    expect(await res.json()).toStrictEqual({ registered: true, artist: null });
  });

  it("未登録なら registered:false だけを返す", async () => {
    meGet.mockResolvedValue(jsonResponse({ registered: false }));

    const res = await createApp().request("/", { method: "GET" });

    expect(await res.json()).toStrictEqual({ registered: false });
  });

  it("api-server が 5xx なら 502 を返す", async () => {
    meGet.mockResolvedValue(
      jsonResponse({ error: "Internal" }, { ok: false, status: 500 }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
  });

  it("表現パターンマスタの取得が失敗したら 502 を返す", async () => {
    meGet.mockResolvedValue(jsonResponse(registeredMe));
    profileGet.mockResolvedValue(
      jsonResponse({
        handle: "saku",
        profile: profileView,
        publishability: { ok: true, missingFields: [] },
      }),
    );
    presentationPatternsGet.mockResolvedValue(
      jsonResponse({ error: "Internal" }, { ok: false, status: 500 }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
  });

  it("プロフィール取得が失敗したら 502 を返す", async () => {
    meGet.mockResolvedValue(jsonResponse(registeredMe));
    profileGet.mockResolvedValue(
      jsonResponse({ error: "Internal" }, { ok: false, status: 500 }),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(502);
  });

  it("api-server の 4xx はステータスと code を透過する", async () => {
    meGet.mockResolvedValue(
      jsonResponse(
        { error: "Unauthorized", code: "UnauthorizedError" },
        { ok: false, status: 401 },
      ),
    );

    const res = await createApp().request("/", { method: "GET" });

    expect(res.status).toBe(401);
    expect(await res.json()).toStrictEqual({
      error: "Unauthorized",
      code: "UnauthorizedError",
    });
  });
});
