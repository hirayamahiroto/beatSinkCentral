import type { Meta, StoryObj } from "@storybook/react";
import AdminCalendarPage from "./index";

const meta = {
  title: "pages/AdminCalendarPage",
  component: AdminCalendarPage,
} satisfies Meta<typeof AdminCalendarPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
