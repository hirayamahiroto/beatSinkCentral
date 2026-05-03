import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "./index";
import { SelectTrigger } from "./Trigger";
import { SelectValue } from "./Value";
import { SelectContent } from "./Content";
import { SelectItem } from "./Item";

const SelectDemo = () => (
  <Select>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Region" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="kanto">関東</SelectItem>
      <SelectItem value="kansai">関西</SelectItem>
      <SelectItem value="other">その他</SelectItem>
    </SelectContent>
  </Select>
);

const meta = {
  title: "atoms/Select",
  component: SelectDemo,
  parameters: {
    docs: {
      description: {
        component:
          "限定された選択肢から 1 つを選ばせるドロップダウン入力 atom。" +
          "文脈を持たない汎用 atom。単独で使わず Label とペアで配置する。選択肢に存在しない値の自由入力が必要な場合は別途 Combobox を検討する。" +
          "`SelectTrigger` / `SelectValue` / `SelectContent` / `SelectItem` を組み合わせて構築する compositional API。Radix UI ベースで、キーボード操作（矢印キー・Enter・Escape）と ARIA 属性が自動で整う。",
      },
    },
  },
} satisfies Meta<typeof SelectDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
