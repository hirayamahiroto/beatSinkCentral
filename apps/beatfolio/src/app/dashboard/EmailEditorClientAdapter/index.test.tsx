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
    error: null,
  }),
}));

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
    updateMock.mockResolvedValueOnce(true);
    render(<EmailEditorClientAdapter email="user@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "変更" }));
    fireEvent.change(screen.getByDisplayValue("user@example.com"), {
      target: { value: "new@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ email: "new@example.com" });
    });
  });
});
