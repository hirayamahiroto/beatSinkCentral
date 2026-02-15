import type { Meta, StoryObj } from "@storybook/react";
import TopPage from "./index";

const meta = {
  title: "pages/TopPage",
  component: TopPage,
} satisfies Meta<typeof TopPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
