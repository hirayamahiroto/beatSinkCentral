import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
import { PlayerDetailClientAdapter } from "./index";

const trackMock = vi.fn();

vi.mock("../../../../libs/analytics", () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

type IntersectionCallback = (
  entries: { target: Element; isIntersecting: boolean }[],
) => void;

type ObserverRecord = {
  callback: IntersectionCallback;
  rootMargin: string | undefined;
  targets: Element[];
};

const observers: ObserverRecord[] = [];

class FakeIntersectionObserver {
  private readonly record: ObserverRecord;

  constructor(
    callback: IntersectionCallback,
    options: { rootMargin?: string } = {},
  ) {
    this.record = { callback, rootMargin: options.rootMargin, targets: [] };
    observers.push(this.record);
  }

  observe(target: Element) {
    this.record.targets.push(target);
  }

  disconnect() {
    this.record.targets.length = 0;
  }
}

const reachChapterEnd = (chapterIndex: number) => {
  const observer = observers[observers.length - 1];
  act(() => {
    observer.callback([
      { target: observer.targets[chapterIndex], isIntersecting: true },
    ]);
  });
};

const storyChapters = [
  { question: "始まりの話", body: "始めたきっかけ。" },
  { question: "転機になったこと", body: "転機の話。" },
  { question: "何を表現したいのか", body: "表現したいこと。" },
];

const renderPlayer = (chapters = storyChapters) =>
  render(
    <PlayerDetailClientAdapter
      artistId="artist-1"
      name="SAKU"
      tagline={null}
      imageUrl={null}
      genres={["Beatbox"]}
      storyChapters={chapters}
      translation={null}
      listeningPoint={null}
      offer={null}
      supportLinks={[]}
    />,
  );

describe("PlayerDetailClientAdapter", () => {
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("最初の章だけを表示し、「続きを読む」で残りの章を展開して story_expand を記録する", () => {
    renderPlayer();

    expect(screen.getByText("始まりの話")).toBeInTheDocument();
    expect(screen.queryByText("転機になったこと")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "続きを読む" }));

    expect(screen.getByText("転機になったこと")).toBeInTheDocument();
    expect(screen.getByText("何を表現したいのか")).toBeInTheDocument();
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith({
      type: "story_expand",
      artistId: "artist-1",
    });
  });

  it("章末の到達判定は「ビューポート下端より上（通過済みを含む）」を root にして観測する", () => {
    renderPlayer();

    expect(observers).toHaveLength(1);
    expect(observers[0].rootMargin).toBe("100000px 0px 0px 0px");
    expect(observers[0].targets).toHaveLength(1);
  });

  it("章末への到達を章数に対する 25/50/75/100% として story_scroll に記録し、同じ depth は一度しか送らない", () => {
    renderPlayer();

    reachChapterEnd(0);
    expect(trackMock.mock.calls).toStrictEqual([
      [{ type: "story_scroll", artistId: "artist-1", depth: 25 }],
    ]);

    fireEvent.click(screen.getByRole("button", { name: "続きを読む" }));
    trackMock.mockClear();

    expect(observers).toHaveLength(2);
    expect(observers[1].targets).toHaveLength(3);

    reachChapterEnd(0);
    expect(trackMock).not.toHaveBeenCalled();

    reachChapterEnd(1);
    reachChapterEnd(2);
    expect(trackMock.mock.calls).toStrictEqual([
      [{ type: "story_scroll", artistId: "artist-1", depth: 50 }],
      [{ type: "story_scroll", artistId: "artist-1", depth: 75 }],
      [{ type: "story_scroll", artistId: "artist-1", depth: 100 }],
    ]);
  });

  it("章が 1 つなら、その章末で 25/50/75/100 を順に記録する", () => {
    renderPlayer([storyChapters[0]]);

    reachChapterEnd(0);

    expect(trackMock.mock.calls).toStrictEqual([
      [{ type: "story_scroll", artistId: "artist-1", depth: 25 }],
      [{ type: "story_scroll", artistId: "artist-1", depth: 50 }],
      [{ type: "story_scroll", artistId: "artist-1", depth: 75 }],
      [{ type: "story_scroll", artistId: "artist-1", depth: 100 }],
    ]);
  });
});
