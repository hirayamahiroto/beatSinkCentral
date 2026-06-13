import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./index";

const meta = {
  title: "atoms/Textarea",
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component:
          "複数行のテキスト入力を受け取る atom。" +
          "文脈を持たない汎用 atom。単独で使わず、`Label` とペアにするか、label / hint / error 連携が必要なら FormField molecule に渡して使う。" +
          "長文の自由記述（Story の各問いへの回答など）を受け取る用途を想定する。",
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rows: 4,
    placeholder: "きっかけや原体験を、思い出すままに。",
  },
};

export const WithValue: Story = {
  args: {
    rows: 4,
    defaultValue:
      "中学の教室で誰かが鳴らしたドラムの真似。たったそれだけで人が振り向いた。",
  },
  parameters: {
    docs: {
      description: {
        story: "値が入った状態。透過背景なので Card の上でも土台のトーンに馴染む。",
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    rows: 4,
    defaultValue: "編集不可の本文",
    disabled: true,
  },
};
