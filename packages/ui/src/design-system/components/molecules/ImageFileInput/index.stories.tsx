import type { Meta, StoryObj } from "@storybook/react-vite";
import { ImageFileInput } from "./index";

const meta = {
  title: "molecules/ImageFileInput",
  component: ImageFileInput,
  parameters: {
    docs: {
      description: {
        component:
          "画像ファイルを1枚選択させる molecule。選択済みの画像はプレビュー表示し、未選択ならプレースホルダを出す。" +
          "アップロード処理そのものは持たず、選択されたファイルを `onFileSelect` で通知するだけ。" +
          "アップロード中は `isUploading` で操作を無効化する。" +
          "`value`（プレビューURL / 未設定は null）の Controlled API のため、RHF とは Controller 経由で接続する。",
      },
    },
  },
} satisfies Meta<typeof ImageFileInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    value: null,
    onFileSelect: () => {},
  },
};

export const WithImage: Story = {
  args: {
    value: "https://placehold.co/160x160/png",
    onFileSelect: () => {},
  },
};

export const Uploading: Story = {
  args: {
    value: null,
    onFileSelect: () => {},
    isUploading: true,
  },
};

export const Disabled: Story = {
  args: {
    value: "https://placehold.co/160x160/png",
    onFileSelect: () => {},
    disabled: true,
  },
};
