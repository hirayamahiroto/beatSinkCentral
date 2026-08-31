import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { HandleEditorClientAdapter } from "./index";

const updateMock = vi.fn();

vi.mock("./hooks/useUpdateMyHandle", () => ({
  useUpdateMyHandle: () => ({
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

const saveNewHandle = (value: string) => {
  fireEvent.click(screen.getByRole("button", { name: "変更" }));
  fireEvent.change(screen.getByDisplayValue("dj_taro"), {
    target: { value },
  });
  fireEvent.click(screen.getByRole("button", { name: "保存" }));
};

describe("HandleEditorClientAdapter", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("初期表示で渡された handle を prefix 付きで表示する", () => {
    render(<HandleEditorClientAdapter handle="dj_taro" />);

    expect(screen.getByText("@dj_taro")).toBeInTheDocument();
  });

  it("値を編集して保存すると、新しい handle で update が呼ばれる", async () => {
    updateMock.mockResolvedValueOnce({ ok: true, value: undefined });
    render(<HandleEditorClientAdapter handle="dj_taro" />);

    saveNewHandle("dj_jiro");

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ handle: "dj_jiro" });
    });
  });

  it("成功したら成功トーストを出す", async () => {
    updateMock.mockResolvedValueOnce({ ok: true, value: undefined });
    render(<HandleEditorClientAdapter handle="dj_taro" />);

    saveNewHandle("dj_jiro");

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith("Handle を更新しました");
    });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("入力値が拒否されたら、トーストではなく入力欄にエラーを出す", async () => {
    updateMock.mockResolvedValueOnce({
      ok: false,
      error: { kind: "rejected", message: "Handle already taken: dj_jiro" },
    });
    render(<HandleEditorClientAdapter handle="dj_taro" />);

    saveNewHandle("dj_jiro");

    await waitFor(() => {
      expect(
        screen.getByText("Handle already taken: dj_jiro"),
      ).toBeInTheDocument();
    });
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("入力値に紐づかない失敗はトーストで出す", async () => {
    updateMock.mockResolvedValueOnce({
      ok: false,
      error: {
        kind: "unexpected",
        message: "通信に失敗しました。時間をおいて再度お試しください",
      },
    });
    render(<HandleEditorClientAdapter handle="dj_taro" />);

    saveNewHandle("dj_jiro");

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
        error: {
          kind: "rejected",
          message: "Handle already taken: dj_jiro",
        },
      })
      .mockResolvedValueOnce({ ok: true, value: undefined });
    render(<HandleEditorClientAdapter handle="dj_taro" />);

    saveNewHandle("dj_jiro");
    await waitFor(() => {
      expect(
        screen.getByText("Handle already taken: dj_jiro"),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue("dj_jiro"), {
      target: { value: "dj_saburo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(
        screen.queryByText("Handle already taken: dj_jiro"),
      ).not.toBeInTheDocument();
    });
  });
});
