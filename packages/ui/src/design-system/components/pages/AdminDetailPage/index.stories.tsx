import type { Meta, StoryObj } from "@storybook/react";
import AdminDetailPage from "./index";

const meta = {
  title: "pages/AdminDetailPage",
  component: AdminDetailPage,
} satisfies Meta<typeof AdminDetailPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
