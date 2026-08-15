import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { EmailEditorClientAdapter } from "./index";

const updateMock = vi.fn();

vi.mock("./hooks/useUpdateMyEmail", () => ({
  useUpdateMyEmail: () => ({
    update: updateMock,
    isLoading: false,
  }),
}));

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@ui/design-system/components/atoms/Toaster", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const saveNewEmail = (value: string) => {
  fireEvent.click(screen.getByRole("button", { name: "変更" }));
  fireEvent.change(screen.getByDisplayValue("user@example.com"), {
    target: { value },
  });
  fireEvent.click(screen.getByRole("button", { name: "保存" }));
};

describe("EmailEditorClientAdapter", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("初期表示で渡された email を表示する", () => {
    render(<EmailEditorClientAdapter email="user@example.com" />);

    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("値を編集して保存すると、新しい email で update が呼ばれる", async () => {
    updateMock.mockResolvedValueOnce({ ok: true });
    render(<EmailEditorClientAdapter email="user@example.com" />);

    saveNewEmail("new@example.com");

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ email: "new@example.com" });
    });
  });

  it("成功したら成功トーストを出す", async () => {
    updateMock.mockResolvedValueOnce({ ok: true });
    render(<EmailEditorClientAdapter email="user@example.com" />);

    saveNewEmail("new@example.com");

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "メールアドレスを更新しました",
      );
    });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("入力値が拒否されたら、トーストではなく入力欄にエラーを出す", async () => {
    updateMock.mockResolvedValueOnce({
      ok: false,
      kind: "rejected",
      message: "Email already taken",
    });
    render(<EmailEditorClientAdapter email="user@example.com" />);

    saveNewEmail("taken@example.com");

    await waitFor(() => {
      expect(screen.getByText("Email already taken")).toBeInTheDocument();
    });
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("入力値に紐づかない失敗はトーストで出す", async () => {
    updateMock.mockResolvedValueOnce({
      ok: false,
      kind: "unexpected",
      message: "通信に失敗しました。時間をおいて再度お試しください",
    });
    render(<EmailEditorClientAdapter email="user@example.com" />);

    saveNewEmail("new@example.com");

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "通信に失敗しました。時間をおいて再度お試しください",
      );
    });
    expect(
      screen.queryByText("通信に失敗しました。時間をおいて再度お試しください"),
    ).not.toBeInTheDocument();
  });

  it("再保存すると前回のエラー表示を消す", async () => {
    updateMock
      .mockResolvedValueOnce({
        ok: false,
        kind: "rejected",
        message: "Email already taken",
      })
      .mockResolvedValueOnce({ ok: true });
    render(<EmailEditorClientAdapter email="user@example.com" />);

    saveNewEmail("taken@example.com");
    await waitFor(() => {
      expect(screen.getByText("Email already taken")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue("taken@example.com"), {
      target: { value: "new@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(screen.queryByText("Email already taken")).not.toBeInTheDocument();
    });
  });
});
