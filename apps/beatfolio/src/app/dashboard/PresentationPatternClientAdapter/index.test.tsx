import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PresentationPatternClientAdapter } from "./index";
import type { useChoosePresentationPattern } from "./hooks/useChoosePresentationPattern";

type Hook = ReturnType<typeof useChoosePresentationPattern>;

const chooseMock = vi.fn<Hook["choose"]>();
const hook: Hook = { choose: chooseMock, isLoading: false, error: null };

vi.mock("./hooks/useChoosePresentationPattern", () => ({
  useChoosePresentationPattern: () => hook,
}));

const options = [
  { code: "interview", label: "インタビュー" },
  { code: "spotlight", label: "スポットライト" },
];

const renderAdapter = () =>
  render(
    <PresentationPatternClientAdapter
      options={options}
      selectedCode="interview"
      previewHref="/players/saku/concept"
    />,
  );

describe("PresentationPatternClientAdapter", () => {
  beforeEach(() => {
    hook.isLoading = false;
    hook.error = null;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("選択肢を選ぶと hook の choose にそのコードを渡す", () => {
    chooseMock.mockResolvedValue(undefined);
    renderAdapter();

    fireEvent.click(screen.getByRole("radio", { name: "スポットライト" }));

    expect(chooseMock).toHaveBeenCalledExactlyOnceWith("spotlight");
  });

  it("hook のエラーをアラートとして表示する", () => {
    hook.error = "表現パターンの保存に失敗しました";
    renderAdapter();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "表現パターンの保存に失敗しました",
    );
  });

  it("hook が処理中なら選択肢を操作できない", () => {
    hook.isLoading = true;
    renderAdapter();

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
  });
});
