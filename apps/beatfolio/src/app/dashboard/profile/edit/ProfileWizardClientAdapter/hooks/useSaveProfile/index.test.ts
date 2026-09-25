import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { useSaveProfile } from "./index";
import {
  createRouterMock,
  type RouterModule,
} from "../../../../../../../utils/navigation/testDoubles";
import {
  createEndpointMock,
  upstreamNoContentResponse,
  upstreamErrorResponse,
  type BeatfolioBffClient,
  type BeatfolioBffClientMock,
} from "../../../../../../../utils/client/testDoubles";

const router = createRouterMock();

vi.mock(
  "next/navigation",
  () => ({ useRouter: () => router }) satisfies RouterModule,
);

const profilePost =
  createEndpointMock<
    BeatfolioBffClient["api"]["artists"]["me"]["profile"]["$post"]
  >();
const publishPost =
  createEndpointMock<
    BeatfolioBffClient["api"]["artists"]["me"]["profile"]["publish"]["$post"]
  >();

const bffClient = {
  api: {
    artists: {
      me: {
        profile: {
          $post: profilePost,
          publish: { $post: publishPost },
        },
      },
    },
  },
} satisfies BeatfolioBffClientMock;

vi.mock("../../../../../../../utils/client", () => ({
  createBeatfolioBffClient: () => bffClient,
}));

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

const savedRequestJson = {
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
};

describe("useSaveProfile", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("submit は合成済みの json で保存し、公開はせずダッシュボードへ遷移する", async () => {
    profilePost.mockResolvedValueOnce(upstreamNoContentResponse());

    const { result } = renderHook(() => useSaveProfile());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.submit(values);
    });

    expect(profilePost).toHaveBeenCalledWith({ json: savedRequestJson });
    expect(publishPost).not.toHaveBeenCalled();
    expect(returned).toBe(true);
    expect(router.push).toHaveBeenCalledWith("/dashboard");
    expect(result.current.error).toBeNull();
  });

  it("saveDraft は保存して画面を更新するだけで、遷移も公開もしない", async () => {
    profilePost.mockResolvedValueOnce(upstreamNoContentResponse());

    const { result } = renderHook(() => useSaveProfile());

    await act(async () => {
      await result.current.saveDraft(values);
    });

    expect(profilePost).toHaveBeenCalledExactlyOnceWith({
      json: savedRequestJson,
    });
    expect(publishPost).not.toHaveBeenCalled();
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("保存が non-ok ならサーバーのエラーを error にセットし遷移しない", async () => {
    profilePost.mockResolvedValueOnce(
      upstreamErrorResponse({ error: "保存に失敗" }, 400),
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
    expect(router.push).not.toHaveBeenCalled();
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("途中まで保存されて失敗したら、どのステップまで保存されたかを error に載せる", async () => {
    profilePost.mockResolvedValueOnce(
      upstreamErrorResponse(
        {
          error: "Invalid snsUrl format",
          code: "InvalidSnsUrlFormatError",
          saved: ["attributes", "chapter:beginning"],
          failedAt: "links",
        },
        422,
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
    expect(router.refresh).not.toHaveBeenCalled();
  });
});
