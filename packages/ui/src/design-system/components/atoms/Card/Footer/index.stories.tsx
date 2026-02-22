import type { Meta, StoryObj } from "@storybook/react";
import { CardFooter } from "./index";

export const meta = {
  title: "atoms/Card/Footer",
  component: CardFooter,
} satisfies Meta<typeof CardFooter>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Card Footer",
  },
};
