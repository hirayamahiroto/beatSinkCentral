import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { OfferEditorClientAdapter } from "./index";
import type { useSaveOffer } from "./hooks/useSaveOffer";

type Hook = ReturnType<typeof useSaveOffer>;

const saveMock = vi.fn<Hook["save"]>();
const hook: Hook = { save: saveMock, isLoading: false, error: null };

vi.mock("./hooks/useSaveOffer", () => ({
  useSaveOffer: () => hook,
}));

const offer = {
  date: "2026-10-10",
  place: "渋谷 WWW",
  ticketUrl: "https://tickets.example.com/e/1",
  comment: "新曲をやります",
  coPerformers: [
    { name: "HANA", handle: "hana_bbx" },
    { name: "飛び入りゲスト", handle: "  " },
  ],
};

describe("OfferEditorClientAdapter", () => {
  beforeEach(() => {
    hook.isLoading = false;
    hook.error = null;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("入力値を保存リクエストの形に写して hook の save に渡す（空ハンドルは null）", async () => {
    saveMock.mockResolvedValue(undefined);
    render(<OfferEditorClientAdapter offer={offer} />);

    fireEvent.click(
      screen.getByRole("button", { name: "オファーを差し替える" }),
    );

    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    expect(saveMock).toHaveBeenCalledWith({
      date: "2026-10-10",
      place: "渋谷 WWW",
      ticketUrl: "https://tickets.example.com/e/1",
      comment: "新曲をやります",
      coPerformers: [
        { name: "HANA", handle: "hana_bbx" },
        { name: "飛び入りゲスト", handle: null },
      ],
    });
  });

  it("hook のエラーをアラートとして表示する", () => {
    hook.error = "オファーの保存に失敗しました";
    render(<OfferEditorClientAdapter offer={null} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "オファーの保存に失敗しました",
    );
  });

  it("hook が処理中なら保存ボタンを押せない", () => {
    hook.isLoading = true;
    render(<OfferEditorClientAdapter offer={null} />);

    expect(screen.getByRole("button", { name: "保存中..." })).toBeDisabled();
  });
});
