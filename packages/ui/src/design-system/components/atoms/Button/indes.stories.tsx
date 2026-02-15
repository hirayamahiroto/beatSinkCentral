import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./index";
import { Play, Filter } from "lucide-react";

const meta = {
  title: "atoms/Button",
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Button",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost Button",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline Button",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Link Button",
  },
};

export const Icon: Story = {
  args: {
    variant: "icon",
    size: "icon",
    children: <Play className="w-4 h-4" />,
  },
};

export const WithIcon: Story = {
  args: {
    variant: "primary",
    children: (
      <>
        <Filter className="w-4 h-4" />
        Filter
      </>
    ),
  },
};
