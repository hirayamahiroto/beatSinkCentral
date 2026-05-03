import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "../index";
import { SelectTrigger } from "../Trigger";
import { SelectValue } from "../Value";
import { SelectContent } from "./index";
import { SelectItem } from "../Item";

const SelectContentDemo = () => (
  <Select>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Select..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="a">Item A</SelectItem>
      <SelectItem value="b">Item B</SelectItem>
    </SelectContent>
  </Select>
);

const meta = {
  title: "atoms/Select/Content",
  component: SelectContentDemo,
  parameters: {
    docs: {
      description: {
        component:
          "Select が開いた時に表示される選択肢のコンテナ。" +
          "Portal 経由で描画され、トリガーの近くにフロート配置される責務を持つ。" +
          "中に `SelectItem` を並べることで選択肢を構成する。",
      },
    },
  },
} satisfies Meta<typeof SelectContentDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
