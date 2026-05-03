import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "../index";
import { SelectTrigger } from "../Trigger";
import { SelectValue } from "../Value";
import { SelectContent } from "../Content";
import { SelectItem } from "./index";

const SelectItemDemo = () => (
  <Select>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Select..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="item1">Item 1</SelectItem>
      <SelectItem value="item2">Item 2</SelectItem>
      <SelectItem value="item3">Item 3</SelectItem>
    </SelectContent>
  </Select>
);

const meta = {
  title: "atoms/Select/Item",
  component: SelectItemDemo,
  parameters: {
    docs: {
      description: {
        component:
          "Select の選択肢ひとつひとつを表す要素。" +
          "`value` 属性で選択時にフォームに渡される値を、children で表示テキストを定義する責務を持つ。" +
          "ホバー・キーボードフォーカスのハイライトや、選択中アイテムのチェック表示は SelectItem 自身が引き受ける。",
      },
    },
  },
} satisfies Meta<typeof SelectItemDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
