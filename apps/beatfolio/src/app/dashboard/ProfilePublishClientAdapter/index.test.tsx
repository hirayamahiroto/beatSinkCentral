import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ProfilePublishClientAdapter } from "./index";
import type { usePublishProfile } from "./hooks/usePublishProfile";

type Hook = ReturnType<typeof usePublishProfile>;

const setPublishedMock = vi.fn<Hook["setPublished"]>();
const hook: Hook = {
  setPublished: setPublishedMock,
  isLoading: false,
  error: null,
  rejectedRequirements: null,
};

vi.mock("./hooks/usePublishProfile", () => ({
  usePublishProfile: () => hook,
}));

describe("ProfilePublishClientAdapter", () => {
  beforeEach(() => {
    hook.isLoading = false;
    hook.error = null;
    hook.rejectedRequirements = null;
    setPublishedMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("公開するを押すと hook の setPublished(true) を呼ぶ", () => {
    render(
      <ProfilePublishClientAdapter
        published={false}
        missingRequirements={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "公開する" }));

    expect(setPublishedMock).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("非公開にするを押すと hook の setPublished(false) を呼ぶ", () => {
    render(
      <ProfilePublishClientAdapter published={true} missingRequirements={[]} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "非公開にする" }));

    expect(setPublishedMock).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("サーバーから不足項目が返っていなければ画面用データの不足項目を表示する", () => {
    render(
      <ProfilePublishClientAdapter
        published={false}
        missingRequirements={["アーティスト写真"]}
      />,
    );

    expect(screen.getByText("アーティスト写真")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "公開する" })).toBeDisabled();
  });

  it("公開が拒否されたら hook の不足項目を画面用データより優先して表示する", () => {
    hook.rejectedRequirements = ["SNS / 配信リンク"];
    render(
      <ProfilePublishClientAdapter
        published={false}
        missingRequirements={["アーティスト写真"]}
      />,
    );

    expect(screen.getByText("SNS / 配信リンク")).toBeInTheDocument();
    expect(screen.queryByText("アーティスト写真")).not.toBeInTheDocument();
  });

  it("hook のエラーをアラートとして表示する", () => {
    hook.error = "公開状態の更新に失敗しました";
    render(
      <ProfilePublishClientAdapter
        published={false}
        missingRequirements={[]}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "公開状態の更新に失敗しました",
    );
  });
});
