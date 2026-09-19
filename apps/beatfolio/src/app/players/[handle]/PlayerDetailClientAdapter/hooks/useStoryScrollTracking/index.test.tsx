import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { useStoryScrollTracking, type StoryScrollDepth } from "./index";

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

const Harness = ({
  chapterCount,
  visibleChapterCount,
  onDepthReached,
}: {
  chapterCount: number;
  visibleChapterCount: number;
  onDepthReached: (depth: StoryScrollDepth) => void;
}) => {
  const { registerChapterEndElement } = useStoryScrollTracking({
    chapterCount,
    visibleChapterCount,
    onDepthReached,
  });

  return (
    <>
      {Array.from({ length: visibleChapterCount }).map((_, index) => (
        <div
          key={index}
          ref={(element) => registerChapterEndElement(index, element)}
        />
      ))}
    </>
  );
};

describe("useStoryScrollTracking", () => {
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("章末の到達判定は「ビューポート下端より上（通過済みを含む）」を root にして観測する", () => {
    const onDepthReached = vi.fn();
    render(
      <Harness
        chapterCount={3}
        visibleChapterCount={1}
        onDepthReached={onDepthReached}
      />,
    );

    expect(observers).toHaveLength(1);
    expect(observers[0].rootMargin).toBe("100000px 0px 0px 0px");
    expect(observers[0].targets).toHaveLength(1);
  });

  it("章末への到達を章数に対する 25/50/75/100% として通知し、同じ depth は一度しか通知しない", () => {
    const onDepthReached = vi.fn();
    render(
      <Harness
        chapterCount={4}
        visibleChapterCount={4}
        onDepthReached={onDepthReached}
      />,
    );

    reachChapterEnd(0);
    expect(onDepthReached).toHaveBeenCalledTimes(1);
    expect(onDepthReached).toHaveBeenCalledWith(25);

    reachChapterEnd(0);
    expect(onDepthReached).toHaveBeenCalledTimes(1);

    reachChapterEnd(3);
    expect(onDepthReached.mock.calls).toStrictEqual([[25], [50], [75], [100]]);
  });

  it("chapterCount が 0 なら observer を作らない", () => {
    const onDepthReached = vi.fn();
    render(
      <Harness
        chapterCount={0}
        visibleChapterCount={0}
        onDepthReached={onDepthReached}
      />,
    );

    expect(observers).toHaveLength(0);
  });
});
