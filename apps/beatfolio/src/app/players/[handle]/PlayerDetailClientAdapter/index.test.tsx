import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PlayerDetailClientAdapter } from "./index";

const trackMock = vi.fn();

vi.mock("../../../../libs/analytics", () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

const baseProps: React.ComponentProps<typeof PlayerDetailClientAdapter> = {
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
    { platform: "youtube", url: "https://youtube.com/@saku", label: "YouTube" },
  ],
};

const offer = {
  dateLabel: "2026/10/01",
  venue: "渋谷",
  ticketUrl: "https://example.com/ticket",
  comment: "来てほしい",
  performers: [],
};

describe("PlayerDetailClientAdapter", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("表示時に profile_view を from 付きで記録する（StrictMode の二重実行でも 1 回）", () => {
    render(
      <React.StrictMode>
        <PlayerDetailClientAdapter {...baseProps} />
      </React.StrictMode>,
    );

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith({
      type: "profile_view",
      artistId: "artist-1",
      from: "announce",
    });
  });

  it("オファー無し期間の SNS リンクをクリックすると support_click を after-story で記録する", () => {
    render(<PlayerDetailClientAdapter {...baseProps} />);
    trackMock.mockClear();

    fireEvent.click(screen.getByRole("link", { name: "YouTube" }));

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith({
      type: "support_click",
      artistId: "artist-1",
      platform: "youtube",
      position: "after-story",
    });
  });

  it("オファーがある期間の SNS リンクをクリックすると support_click を return-path で記録する", () => {
    render(<PlayerDetailClientAdapter {...baseProps} offer={offer} />);
    trackMock.mockClear();

    fireEvent.click(screen.getByRole("link", { name: "YouTube" }));

    expect(trackMock).toHaveBeenCalledWith({
      type: "support_click",
      artistId: "artist-1",
      platform: "youtube",
      position: "return-path",
    });
  });
});
