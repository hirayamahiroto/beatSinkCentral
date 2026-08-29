import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { useSaveProfile } from "./index";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
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
  storyOrigin: "始めたきっかけ。",
  storyTurning: "",
  storyNow: "",
  location: "東京",
  activityForm: "solo",
  affiliation: "",
  links: [{ type: "youtube", url: "https://youtube.com/@saku" }],
};

describe("useSaveProfile", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("submit は合成済みの json で保存した後に publish を published=true で呼び refresh する", async () => {
    saveMock.mockResolvedValueOnce(buildJsonResponse({}, { status: 200 }));
    publishMock.mockResolvedValueOnce(buildJsonResponse({}, { status: 200 }));

    const { result } = renderHook(() => useSaveProfile());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.submit(values);
    });

    expect(saveMock).toHaveBeenCalledWith({
      json: {
        name: "SAKU",
        imageUrl: "https://example.com/saku.jpg",
        tagline: "口ひとつで、フロアを揺らす。",
        story: "始めたきっかけ。",
        activityInfo: "拠点: 東京 / 形態: ソロ",
        genres: ["Beatbox"],
        links: [{ type: "youtube", url: "https://youtube.com/@saku" }],
      },
    });
    expect(publishMock).toHaveBeenCalledWith({ json: { published: true } });
    expect(returned).toBe(true);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it("saveDraft は publish を呼ばない", async () => {
    saveMock.mockResolvedValueOnce(buildJsonResponse({}, { status: 200 }));

    const { result } = renderHook(() => useSaveProfile());

    await act(async () => {
      await result.current.saveDraft(values);
    });

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(publishMock).not.toHaveBeenCalled();
  });

  it("保存が non-ok ならサーバーのエラーを error にセットし publish は呼ばない", async () => {
    saveMock.mockResolvedValueOnce(
      buildJsonResponse({ error: "保存に失敗" }, { status: 400 }),
    );

    const { result } = renderHook(() => useSaveProfile());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.submit(values);
    });

    expect(returned).toBe(false);
    expect(result.current.error).toBe("保存に失敗");
    expect(publishMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("公開が non-ok なら publish のエラーを error にセットし refresh しない", async () => {
    saveMock.mockResolvedValueOnce(buildJsonResponse({}, { status: 200 }));
    publishMock.mockResolvedValueOnce(
      buildJsonResponse({ error: "必須項目が揃っていません" }, { status: 422 }),
    );

    const { result } = renderHook(() => useSaveProfile());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.submit(values);
    });

    expect(returned).toBe(false);
    expect(result.current.error).toBe("必須項目が揃っていません");
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
