import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { useSaveProfile } from "./index";

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
    push: pushMock,
  }),
}));

const saveMock = vi.fn();
const publishMock = vi.fn();

vi.mock("../../../../../../../utils/client", () => ({
  createBeatfolioBffClient: () => ({
    api: {
      artists: {
        me: {
          profile: {
            $post: saveMock,
            publish: { $post: publishMock },
          },
        },
      },
    },
  }),
}));

const buildJsonResponse = (body: unknown, init: { status: number }): Response =>
  new Response(JSON.stringify(body), {
    status: init.status,
    headers: { "Content-Type": "application/json" },
  });

const values: WizardValues = {
  name: "SAKU",
  imageUrl: "https://example.com/saku.jpg",
  tagline: "口ひとつで、フロアを揺らす。",
  genres: ["Beatbox"],
  chapters: {
    beginning: "始めたきっかけ。",
    turning_point: "",
    concept: "",
  },
  location: "東京",
  activityForm: "solo",
  affiliation: "",
  links: [{ type: "youtube", url: "https://youtube.com/@saku" }],
};

describe("useSaveProfile", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("submit は合成済みの json で保存し、公開はせずダッシュボードへ遷移する", async () => {
    saveMock.mockResolvedValueOnce(buildJsonResponse({}, { status: 200 }));

    const { result } = renderHook(() => useSaveProfile());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.submit(values);
    });

    expect(saveMock).toHaveBeenCalledWith({
      json: {
        name: "SAKU",
        tagline: "口ひとつで、フロアを揺らす。",
        activityInfo: "拠点: 東京 / 形態: ソロ",
        genres: ["Beatbox"],
        chapters: [
          { questionCode: "beginning", body: "始めたきっかけ。" },
          { questionCode: "turning_point", body: "" },
          { questionCode: "concept", body: "" },
        ],
        links: [{ type: "youtube", url: "https://youtube.com/@saku" }],
      },
    });
    expect(publishMock).not.toHaveBeenCalled();
    expect(returned).toBe(true);
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
    expect(result.current.error).toBeNull();
  });

  it("saveDraft は保存して画面を更新するだけで、遷移も公開もしない", async () => {
    saveMock.mockResolvedValueOnce(buildJsonResponse({}, { status: 200 }));

    const { result } = renderHook(() => useSaveProfile());

    await act(async () => {
      await result.current.saveDraft(values);
    });

    expect(saveMock).toHaveBeenCalledExactlyOnceWith({
      json: {
        name: "SAKU",
        tagline: "口ひとつで、フロアを揺らす。",
        activityInfo: "拠点: 東京 / 形態: ソロ",
        genres: ["Beatbox"],
        chapters: [
          { questionCode: "beginning", body: "始めたきっかけ。" },
          { questionCode: "turning_point", body: "" },
          { questionCode: "concept", body: "" },
        ],
        links: [{ type: "youtube", url: "https://youtube.com/@saku" }],
      },
    });
    expect(publishMock).not.toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("保存が non-ok ならサーバーのエラーを error にセットし遷移しない", async () => {
    saveMock.mockResolvedValueOnce(
      buildJsonResponse({ error: "保存に失敗" }, { status: 400 }),
    );

    const { result } = renderHook(() => useSaveProfile());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.submit(values);
    });

    expect(returned).toBe(false);
    expect(result.current.error).toStrictEqual({
      message: "保存に失敗",
      progress: null,
    });
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("途中まで保存されて失敗したら、どのステップまで保存されたかを error に載せる", async () => {
    saveMock.mockResolvedValueOnce(
      buildJsonResponse(
        {
          error: "Invalid snsUrl format",
          code: "InvalidSnsUrlFormatError",
          saved: ["attributes", "chapter:beginning"],
          failedAt: "links",
        },
        { status: 422 },
      ),
    );

    const { result } = renderHook(() => useSaveProfile());

    await act(async () => {
      await result.current.saveDraft(values);
    });

    expect(result.current.error).toStrictEqual({
      message: "Invalid snsUrl format",
      progress: {
        saved: ["attributes", "chapter:beginning"],
        failedAt: "links",
      },
    });
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
