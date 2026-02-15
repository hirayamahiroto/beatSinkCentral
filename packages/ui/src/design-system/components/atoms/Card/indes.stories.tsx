import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./index";
import { CardHeader } from "./Header";
import { CardTitle } from "./Title";
import { CardDescription } from "./Description";
import { CardContent } from "./Content";
import { CardFooter } from "./Footer";

const meta = {
  title: "atoms/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: "w-96",
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </>
    ),
  },
};
