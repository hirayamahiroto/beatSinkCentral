import { useEffect, useRef } from "react";

type StoryScrollDepth = 25 | 50 | 75 | 100;

const STORY_SCROLL_DEPTHS: readonly StoryScrollDepth[] = [25, 50, 75, 100];

const ABOVE_VIEWPORT_BOTTOM_ROOT_MARGIN = "100000px 0px 0px 0px";

const reachedStoryScrollDepths = (
  readChapterCount: number,
  chapterCount: number,
): StoryScrollDepth[] => {
  const readPercent = Math.floor((readChapterCount * 100) / chapterCount);
  return STORY_SCROLL_DEPTHS.filter((depth) => depth <= readPercent);
};

export type { StoryScrollDepth };

export const useStoryScrollTracking = ({
  chapterCount,
  visibleChapterCount,
  onDepthReached,
}: {
  chapterCount: number;
  visibleChapterCount: number;
  onDepthReached: (depth: StoryScrollDepth) => void;
}) => {
  const chapterEndElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const firedDepthsRef = useRef<Set<StoryScrollDepth>>(new Set());

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (chapterCount === 0) return;

    const indexByElement = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = indexByElement.get(entry.target);
          if (!entry.isIntersecting || index === undefined) return;
          reachedStoryScrollDepths(index + 1, chapterCount).forEach((depth) => {
            if (firedDepthsRef.current.has(depth)) return;
            firedDepthsRef.current.add(depth);
            onDepthReached(depth);
          });
        });
      },
      { rootMargin: ABOVE_VIEWPORT_BOTTOM_ROOT_MARGIN },
    );

    chapterEndElementsRef.current
      .slice(0, visibleChapterCount)
      .forEach((element, index) => {
        if (element === null) return;
        indexByElement.set(element, index);
        observer.observe(element);
      });

    return () => observer.disconnect();
  }, [onDepthReached, chapterCount, visibleChapterCount]);

  const registerChapterEndElement = (
    index: number,
    element: HTMLDivElement | null,
  ) => {
    chapterEndElementsRef.current[index] = element;
  };

  return { registerChapterEndElement };
};
