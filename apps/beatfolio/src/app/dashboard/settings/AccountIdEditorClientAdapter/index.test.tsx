import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { AccountIdEditorClientAdapter } from "./index";

const updateMock = vi.fn();

vi.mock("./hooks/useUpdateMyAccountId", () => ({
  useUpdateMyAccountId: () => ({
    update: updateMock,
    isLoading: false,
    error: null,
  }),
}));

describe("AccountIdEditorClientAdapter", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("初期表示で渡された accountId を prefix 付きで表示する", () => {
    render(<AccountIdEditorClientAdapter accountId="dj_taro" />);

    expect(screen.getByText("@dj_taro")).toBeInTheDocument();
  });

  it("値を編集して保存すると、新しい accountId で update が呼ばれる", async () => {
    updateMock.mockResolvedValueOnce(true);
    render(<AccountIdEditorClientAdapter accountId="dj_taro" />);

    fireEvent.click(screen.getByRole("button", { name: "変更" }));
    fireEvent.change(screen.getByDisplayValue("dj_taro"), {
      target: { value: "dj_jiro" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ accountId: "dj_jiro" });
    });
  });
});
