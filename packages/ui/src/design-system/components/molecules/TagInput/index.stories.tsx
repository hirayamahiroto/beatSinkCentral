import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TagInput } from "./index";

const meta = {
  title: "molecules/TagInput",
  component: TagInput,
  parameters: {
    docs: {
      description: {
        component:
          "自由入力で複数のタグ（ジャンル等）を追加・削除できる molecule。" +
          "『1 つの値』ではなく『値の集合』を受け取りたい入力に使う。Enter で確定追加、× で削除。重複は無視する。" +
          "`value` / `onChange`（string[]）の Controlled API のため、RHF とは Controller 経由で接続する。",
      },
    },
  },
} satisfies Meta<typeof TagInput>;

export default meta;

type Story = StoryObj<typeof meta>;

const Interactive = ({
  value: initial,
  placeholder,
}: {
  value: string[];
  placeholder?: string;
}) => {
  const [value, setValue] = React.useState<string[]>(initial);
  return (
    <TagInput value={value} onChange={setValue} placeholder={placeholder} />
  );
};

export const Default: Story = {
  args: {
    value: ["Beatbox", "Loopstation"],
    onChange: () => {},
    placeholder: "例: Beatbox",
  },
  render: (args) => (
    <Interactive value={args.value} placeholder={args.placeholder} />
  ),
};

export const Empty: Story = {
  args: {
    value: [],
    onChange: () => {},
    placeholder: "入力して Enter",
  },
  render: (args) => (
    <Interactive value={args.value} placeholder={args.placeholder} />
  ),
  parameters: {
    docs: {
      description: {
        story: "未入力の初期状態。プレースホルダで追加方法を伝える。",
      },
    },
  },
};
