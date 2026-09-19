import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useNotifySubscription } from "./index";

describe("useNotifySubscription", () => {
  it("初期状態は email が空文字、subscribed=false で、setEmail で入力値を更新できる", () => {
    const onSubscribe = vi.fn();
    const { result } = renderHook(() => useNotifySubscription({ onSubscribe }));

    expect(result.current.email).toBe("");
    expect(result.current.subscribed).toBe(false);

    act(() => {
      result.current.setEmail("foo@example.com");
    });

    expect(result.current.email).toBe("foo@example.com");
  });

  it("submit すると onSubscribe に入力値が渡り、email がクリアされ subscribed=true になる", () => {
    const onSubscribe = vi.fn();
    const { result } = renderHook(() => useNotifySubscription({ onSubscribe }));

    act(() => {
      result.current.setEmail("foo@example.com");
    });
    act(() => {
      result.current.submit();
    });

    expect(onSubscribe).toHaveBeenCalledWith("foo@example.com");
    expect(result.current.email).toBe("");
    expect(result.current.subscribed).toBe(true);
  });
});
