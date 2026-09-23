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
import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { ProfileWizardClientAdapter } from "./index";
import type { useSaveProfile } from "./hooks/useSaveProfile";
import type { uploadMyProfileImage } from "../../../../../fetchers/artists/uploadMyProfileImage";
import { ok, err } from "../../../../../utils/result";

type Hook = ReturnType<typeof useSaveProfile>;

const submitMock = vi.fn<Hook["submit"]>();
const saveDraftMock = vi.fn<Hook["saveDraft"]>();
const hook: Hook = {
  submit: submitMock,
  saveDraft: saveDraftMock,
  isLoading: false,
  error: null,
};

vi.mock("./hooks/useSaveProfile", () => ({
  useSaveProfile: () => hook,
}));

const uploadMock = vi.fn<typeof uploadMyProfileImage>();

vi.mock("../../../../../fetchers/artists/uploadMyProfileImage", () => ({
  uploadMyProfileImage: (file: File) => uploadMock(file),
}));

const linkTypeOptions = [
  { type: "youtube", label: "YouTube" },
  { type: "x", label: "X" },
];

const storyQuestions = [
  { code: "beginning", label: "始まり", required: true },
  { code: "concept", label: "何を表現したいのか", required: false },
];

const completeValues: WizardValues = {
  name: "SAKU",
  imageUrl: "https://example.com/saku.jpg",
  tagline: "口ひとつで、フロアを揺らす。",
  genres: ["Beatbox"],
  chapters: { beginning: "始めたきっかけ。", concept: "" },
  location: "東京",
  activityForm: "solo",
  affiliation: "",
  links: [{ type: "youtube", url: "https://youtube.com/@saku" }],
};

const renderWizard = (defaultValues: Partial<WizardValues> = completeValues) =>
  render(
    <ProfileWizardClientAdapter
      email="saku@example.com"
      linkTypeOptions={linkTypeOptions}
      storyQuestions={storyQuestions}
      defaultValues={defaultValues}
    />,
  );

const goToLastStep = async () => {
  for (let i = 0; i < 4; i += 1) {
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    await waitFor(() => expect(saveDraftMock).toHaveBeenCalledTimes(i + 1));
  }
  await screen.findByRole("button", { name: "保存する" });
};

describe("ProfileWizardClientAdapter", () => {
  beforeEach(() => {
    hook.isLoading = false;
    hook.error = null;
    submitMock.mockResolvedValue(true);
    saveDraftMock.mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("次へ進むたびに入力中の値で hook の saveDraft を呼ぶ", async () => {
    renderWizard();

    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    await waitFor(() => expect(saveDraftMock).toHaveBeenCalledTimes(1));
    expect(saveDraftMock.mock.calls[0][0]).toMatchObject({
      name: "SAKU",
      imageUrl: "https://example.com/saku.jpg",
      links: [{ type: "youtube", url: "https://youtube.com/@saku" }],
    });
  });

  it("最終ステップで保存すると入力値で hook の submit を呼ぶ", async () => {
    renderWizard();
    await goToLastStep();

    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));
    expect(submitMock.mock.calls[0][0]).toMatchObject({
      name: "SAKU",
      chapters: { beginning: "始めたきっかけ。", concept: "" },
      links: [{ type: "youtube", url: "https://youtube.com/@saku" }],
    });
  });

  it("hook のエラーをメッセージと、どこまで保存できたかの説明に写して表示する", async () => {
    hook.error = {
      message: "プロフィールの保存に失敗しました",
      progress: {
        saved: ["attributes", "chapter:beginning"],
        failedAt: "links",
      },
    };
    renderWizard();
    await goToLastStep();

    expect(
      screen.getByText("プロフィールの保存に失敗しました"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "基本・活動・Storyは保存済みです。リンクの保存に失敗しました。もう一度保存すると全体が反映されます。",
      ),
    ).toBeInTheDocument();
  });

  it("画像を選ぶと fetcher でアップロードし、返った URL を写真に反映する", async () => {
    uploadMock.mockResolvedValue(
      ok({ imageUrl: "https://example.com/uploaded.jpg" }),
    );
    renderWizard({ ...completeValues, imageUrl: "" });
    const file = new File(["png"], "saku.png", { type: "image/png" });

    fireEvent.change(screen.getByLabelText("アーティスト写真"), {
      target: { files: [file] },
    });

    await waitFor(() =>
      expect(uploadMock).toHaveBeenCalledExactlyOnceWith(file),
    );
    await screen.findByRole("button", { name: "画像を変更" });
  });

  it("アップロードが失敗したら fetcher のメッセージを写真の欄に表示する", async () => {
    uploadMock.mockResolvedValue(
      err({ kind: "rejected", message: "5MB以下の画像を選択してください" }),
    );
    renderWizard({ ...completeValues, imageUrl: "" });

    fireEvent.change(screen.getByLabelText("アーティスト写真"), {
      target: {
        files: [new File(["png"], "saku.png", { type: "image/png" })],
      },
    });

    expect(
      await screen.findByText("5MB以下の画像を選択してください"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "画像を選択" })).toBeEnabled();
  });
});
