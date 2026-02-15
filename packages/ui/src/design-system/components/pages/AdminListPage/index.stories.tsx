import type { Meta, StoryObj } from "@storybook/react";
import AdminListPage from "./index";

const meta = {
  title: "pages/AdminListPage",
  component: AdminListPage,
} satisfies Meta<typeof AdminListPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
