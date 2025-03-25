import type { Meta, StoryObj } from "@storybook/react";
import PlayersPage from "./index";

const meta = {
  title: "pages/PlayersPage",
  component: PlayersPage,
} satisfies Meta<typeof PlayersPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
