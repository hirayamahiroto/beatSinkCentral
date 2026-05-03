import type { Meta, StoryObj } from "@storybook/react-vite";
import { samplePlayerData } from "./index.mock";
import { PlayerPage } from "./index";

const meta = {
  title: "pages/PlayerPage",
  component: PlayerPage,
} satisfies Meta<typeof PlayerPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    playerData: samplePlayerData.playerData,
  },
};
