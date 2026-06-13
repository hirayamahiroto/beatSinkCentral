import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./index";

const meta = {
  title: "atoms/Switch",
  component: Switch,
  parameters: {
    docs: {
      description: {
        component:
          "オン / オフの二値を切り替える atom。" +
          "「即時に効く設定」を表す用途に使う（例: プロフィールの公開 / 非公開）。送信して初めて確定する選択には使わない。" +
          "`checked` / `onCheckedChange` の Controlled API を持つため、RHF とは Controller 経由で接続する。",
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: { defaultChecked: false },
};

export const On: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { defaultChecked: true, disabled: true },
};
