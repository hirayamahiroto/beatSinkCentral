import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "../index";
import { SelectTrigger } from "./index";
import { SelectValue } from "../Value";

const SelectTriggerDemo = () => (
  <Select>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Select..." />
    </SelectTrigger>
  </Select>
);

const meta = {
  title: "atoms/Select/Trigger",
  component: SelectTriggerDemo,
  parameters: {
    docs: {
      description: {
        component:
          "Select ドロップダウンを開閉するトリガー要素。" +
          "閉じている時は現在の選択値（`SelectValue`）を表示し、開閉アイコンを伴う責務を持つ。" +
          "ユーザーがクリック・Enter・Space で開き、Escape で閉じる対話の起点になる。",
      },
    },
  },
} satisfies Meta<typeof SelectTriggerDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
