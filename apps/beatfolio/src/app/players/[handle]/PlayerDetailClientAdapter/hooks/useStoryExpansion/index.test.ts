import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useStoryExpansion } from "./index";

describe("useStoryExpansion", () => {
  it("初期状態は expanded=false で、expand を呼ぶと true になり onExpand が一度呼ばれる", () => {
    const onExpand = vi.fn();
    const { result } = renderHook(() => useStoryExpansion({ onExpand }));

    expect(result.current.expanded).toBe(false);

    act(() => {
      result.current.expand();
    });

    expect(result.current.expanded).toBe(true);
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("expand を複数回呼んでも onExpand は呼ばれるたびに実行される", () => {
    const onExpand = vi.fn();
    const { result } = renderHook(() => useStoryExpansion({ onExpand }));

    act(() => {
      result.current.expand();
    });
    act(() => {
      result.current.expand();
    });

    expect(result.current.expanded).toBe(true);
    expect(onExpand).toHaveBeenCalledTimes(2);
  });
});
