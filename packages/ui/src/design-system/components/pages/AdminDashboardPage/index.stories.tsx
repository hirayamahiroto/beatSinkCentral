import type { Meta, StoryObj } from "@storybook/react";
import AdminDashboardPage from "./index";

const meta = {
  title: "pages/AdminDashboardPage",
  component: AdminDashboardPage,
} satisfies Meta<typeof AdminDashboardPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
