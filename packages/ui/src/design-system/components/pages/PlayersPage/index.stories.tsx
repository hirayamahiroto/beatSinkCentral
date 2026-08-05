import type { Meta, StoryObj } from "@storybook/react-vite";
import PlayersPage from "./index";
import { players } from "./index.mock";

const meta = {
  title: "pages/PlayersPage",
  component: PlayersPage,
  parameters: {
    docs: {
      description: {
        component:
          "公開されているプレイヤーを一覧し、活動名で絞り込んで各プレイヤーの公開ページへ送り出す画面。",
      },
    },
  },
} satisfies Meta<typeof PlayersPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    players,
  },
};

export const Empty: Story = {
  name: "公開プレイヤーが0件",
  args: {
    players: [],
  },
};
