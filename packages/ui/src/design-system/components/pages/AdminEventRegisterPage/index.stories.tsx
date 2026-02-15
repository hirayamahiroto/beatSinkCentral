import type { Meta, StoryObj } from "@storybook/react";
import AdminEventRegisterPage from "./index";

const meta = {
  title: "pages/AdminEventRegisterPage",
  component: AdminEventRegisterPage,
} satisfies Meta<typeof AdminEventRegisterPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
