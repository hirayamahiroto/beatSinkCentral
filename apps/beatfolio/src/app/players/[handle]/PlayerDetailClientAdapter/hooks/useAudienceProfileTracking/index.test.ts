import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useAudienceProfileTracking } from "./index";

const trackMock = vi.fn();

vi.mock("../../../../../../libs/analytics", () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

const supportLinks = [
  { platform: "youtube", label: "YouTube" },
  { platform: "other", label: "その他" },
];

describe("useAudienceProfileTracking", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("マウント時に profile_view を from 付きで 1 回記録する", () => {
    const { rerender } = renderHook(() =>
      useAudienceProfileTracking({
        artistId: "artist-1",
        profileViewFrom: "announce",
        supportLinks,
        hasOffer: false,
      }),
    );
    rerender();

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith({
      type: "profile_view",
      artistId: "artist-1",
      from: "announce",
    });
  });

  it("from が変わったら改めて profile_view を記録する", () => {
    const { rerender } = renderHook(
      (props: { profileViewFrom: "announce" | "share" }) =>
        useAudienceProfileTracking({
          artistId: "artist-1",
          profileViewFrom: props.profileViewFrom,
          supportLinks,
          hasOffer: false,
        }),
      { initialProps: { profileViewFrom: "announce" } },
    );
    rerender({ profileViewFrom: "share" });

    expect(trackMock).toHaveBeenCalledTimes(2);
    expect(trackMock).toHaveBeenLastCalledWith({
      type: "profile_view",
      artistId: "artist-1",
      from: "share",
    });
  });

  it("SNS リンクのラベルから platform を解決し、オファー無し期間は after-story として support_click を記録する", () => {
    const { result } = renderHook(() =>
      useAudienceProfileTracking({
        artistId: "artist-1",
        profileViewFrom: "none",
        supportLinks,
        hasOffer: false,
      }),
    );
    trackMock.mockClear();

    result.current.trackSupportClick("YouTube");

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith({
      type: "support_click",
      artistId: "artist-1",
      platform: "youtube",
      position: "after-story",
    });
  });

  it("オファーがある期間の SNS リンクは return-path として記録する", () => {
    const { result } = renderHook(() =>
      useAudienceProfileTracking({
        artistId: "artist-1",
        profileViewFrom: "none",
        supportLinks,
        hasOffer: true,
      }),
    );
    trackMock.mockClear();

    result.current.trackSupportClick("その他");

    expect(trackMock).toHaveBeenCalledWith({
      type: "support_click",
      artistId: "artist-1",
      platform: "other",
      position: "return-path",
    });
  });

  it("supportLinks に無いラベルは platform を解決できないため記録しない", () => {
    const { result } = renderHook(() =>
      useAudienceProfileTracking({
        artistId: "artist-1",
        profileViewFrom: "none",
        supportLinks,
        hasOffer: false,
      }),
    );
    trackMock.mockClear();

    result.current.trackSupportClick("Unknown");

    expect(trackMock).not.toHaveBeenCalled();
  });
});
