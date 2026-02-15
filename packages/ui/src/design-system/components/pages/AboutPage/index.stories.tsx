import type { Meta, StoryObj } from "@storybook/react";
import AboutPage from "./index";

const meta = {
  title: "pages/AboutPage",
  component: AboutPage,
} satisfies Meta<typeof AboutPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
