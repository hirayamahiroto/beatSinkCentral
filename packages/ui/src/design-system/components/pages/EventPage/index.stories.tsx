import type { Meta, StoryObj } from "@storybook/react-vite";
import EventPage from "./index";

const meta = {
  title: "pages/EventPage",
  component: EventPage,
} satisfies Meta<typeof EventPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
