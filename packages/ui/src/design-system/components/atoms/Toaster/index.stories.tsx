import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toaster, toast } from "./index";
import { Button } from "../Button";

const meta = {
  title: "atoms/Toaster",
  component: Toaster,
  parameters: {
    docs: {
      description: {
        component:
          "画面全体で 1 つだけ設置する通知の表示器。アプリのルートレイアウトに置き、各画面は `toast()` で発火する。" +
          "「何をいつ通知するか」と文言は呼び出し側（アプリケーション層）が決め、この atom は表示だけを担う。" +
          "入力欄に紐づく失敗はフィールド内に表示し、ここでは成功と入力欄に紐づかない失敗を扱う。",
      },
    },
  },
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {
  render: (args) => (
    <>
      <Toaster {...args} />
      <Button onClick={() => toast.success("メールアドレスを更新しました")}>
        成功を通知する
      </Button>
    </>
  ),
};

export const Error: Story = {
  render: (args) => (
    <>
      <Toaster {...args} />
      <Button
        onClick={() => toast.error("通信に失敗しました。再度お試しください")}
      >
        失敗を通知する
      </Button>
    </>
  ),
};

export const TopCenter: Story = {
  args: { position: "top-center" },
  render: (args) => (
    <>
      <Toaster {...args} />
      <Button onClick={() => toast.success("上部中央に表示する")}>
        位置を変えて通知する
      </Button>
    </>
  ),
};
