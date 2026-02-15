import type { Meta, StoryObj } from "@storybook/react";
import { Image } from "./index";

const meta = {
  title: "atoms/Image",
  component: Image,
} satisfies Meta<typeof Image>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    src: "/image1.jpeg",
    alt: "",
  },
};
