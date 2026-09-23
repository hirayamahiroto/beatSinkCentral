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
import { OnboardingClientAdapter } from "./index";
import type { useCreateUser } from "./hooks/useCreateUser";

type Hook = ReturnType<typeof useCreateUser>;

const handleSubmitMock = vi.fn<Hook["handleSubmit"]>();
const useCreateUserMock = vi.fn<typeof useCreateUser>();
const hook: Hook = {
  handleSubmit: handleSubmitMock,
  isLoading: false,
  error: null,
};

vi.mock("./hooks/useCreateUser", () => ({
  useCreateUser: (params: Parameters<typeof useCreateUser>[0]) =>
    useCreateUserMock(params),
}));

describe("OnboardingClientAdapter", () => {
  beforeEach(() => {
    hook.isLoading = false;
    hook.error = null;
    useCreateUserMock.mockReturnValue(hook);
    handleSubmitMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("ログイン中の email を hook に渡し、入力したハンドルで handleSubmit を呼ぶ", async () => {
    render(<OnboardingClientAdapter email="saku@example.com" />);

    expect(useCreateUserMock).toHaveBeenCalledWith({
      email: "saku@example.com",
    });

    fireEvent.change(screen.getByLabelText("ハンドル"), {
      target: { value: "saku_01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "プロフィールを作成" }));

    await waitFor(() => expect(handleSubmitMock).toHaveBeenCalledTimes(1));
    expect(handleSubmitMock.mock.calls[0][0]).toStrictEqual({
      handle: "saku_01",
    });
  });

  it("hook のエラーを表示する", () => {
    hook.error = "このハンドルは既に使われています";
    render(<OnboardingClientAdapter email="saku@example.com" />);

    expect(
      screen.getByText("このハンドルは既に使われています"),
    ).toBeInTheDocument();
  });

  it("hook が処理中なら作成ボタンを押せない", () => {
    hook.isLoading = true;
    render(<OnboardingClientAdapter email="saku@example.com" />);

    expect(screen.getByRole("button", { name: /作成中/ })).toBeDisabled();
  });
});
