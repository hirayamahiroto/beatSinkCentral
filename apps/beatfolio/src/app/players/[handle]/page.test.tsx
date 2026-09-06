import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import PlayerDetailPage from "./page";

const getPlayerDetailMock = vi.fn();
const adapterMock = vi.fn();
const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("../../../fetchers/players/getPlayerDetail", () => ({
  getPlayerDetail: (...args: unknown[]) => getPlayerDetailMock(...args),
}));

vi.mock("./PlayerDetailClientAdapter", () => ({
  PlayerDetailClientAdapter: (props: unknown) => {
    adapterMock(props);
    return null;
  },
}));

vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

const player = {
  artistId: "artist-1",
  name: "SAKU",
  tagline: null,
  imageUrl: null,
  genres: [],
  storyChapters: [{ question: "Story", body: "始めたきっかけ。" }],
  translation: null,
  listeningPoint: null,
  offer: null,
  supportLinks: [
    { platform: "youtube", url: "https://youtube.com/@saku", label: "YouTube" },
  ],
};

const renderPage = async (searchParams: {
  [key: string]: string | string[] | undefined;
}) =>
  render(
    await PlayerDetailPage({
      params: Promise.resolve({ handle: "saku" }),
      searchParams: Promise.resolve(searchParams),
    }),
  );

describe("PlayerDetailPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("?from= を 5 値に正規化し、artistId とともに ClientAdapter へ渡す", async () => {
    getPlayerDetailMock.mockResolvedValue({ ok: true, value: player });

    await renderPage({ from: "announce" });

    expect(getPlayerDetailMock).toHaveBeenCalledWith({ handle: "saku" });
    expect(adapterMock).toHaveBeenCalledWith({
      artistId: "artist-1",
      profileViewFrom: "announce",
      name: "SAKU",
      tagline: null,
      imageUrl: null,
      genres: [],
      storyChapters: [{ question: "Story", body: "始めたきっかけ。" }],
      translation: null,
      listeningPoint: null,
      offer: null,
      supportLinks: [
        {
          platform: "youtube",
          url: "https://youtube.com/@saku",
          label: "YouTube",
        },
      ],
    });
  });

  it("from が無ければ none として渡す", async () => {
    getPlayerDetailMock.mockResolvedValue({ ok: true, value: player });

    await renderPage({});

    expect(adapterMock.mock.calls[0][0]).toMatchObject({
      profileViewFrom: "none",
    });
  });

  it("プレイヤーが見つからなければ notFound を呼ぶ", async () => {
    getPlayerDetailMock.mockResolvedValue({
      ok: false,
      error: { kind: "notFound", message: "not found" },
    });

    await expect(renderPage({})).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(adapterMock).not.toHaveBeenCalled();
  });
});
