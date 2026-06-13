import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stepper } from "./index";

const meta = {
  title: "molecules/Stepper",
  component: Stepper,
  parameters: {
    docs: {
      description: {
        component:
          "複数ステップに分かれた入力の進捗を可視化する molecule。" +
          "『全体で何ステップあり、今どこにいて、どこまで終わったか』を一目で伝える責務を持つ。ステップ間の遷移制御そのものは持たず、状態（現在ステップ）は呼び出し側が管理して渡す。",
      },
    },
  },
} satisfies Meta<typeof Stepper>;

export default meta;

type Story = StoryObj<typeof meta>;

const STEPS = ["基本", "Story", "活動", "リンク", "確認"];

export const FirstStep: Story = {
  args: { steps: STEPS, current: 1 },
};

export const Midway: Story = {
  args: { steps: STEPS, current: 3 },
  parameters: {
    docs: {
      description: {
        story: "途中まで完了した状態。完了済みは ✓、現在地はリング付きで示す。",
      },
    },
  },
};

export const LastStep: Story = {
  args: { steps: STEPS, current: 5 },
};
