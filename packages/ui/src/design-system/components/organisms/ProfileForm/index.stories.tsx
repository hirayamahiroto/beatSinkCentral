import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProfileForm } from "./index";

const meta = {
  title: "organisms/ProfileForm",
  component: ProfileForm,
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-black p-8">
        <div className="max-w-md mx-auto backdrop-blur-md bg-white/5 p-8 rounded-2xl border border-white/10">
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    onSubmit: (data) => {
      console.log("submitted", data);
    },
  },
} satisfies Meta<typeof ProfileForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    email: "user@example.com",
    isLoading: false,
    error: null,
  },
};

export const Loading: Story = {
  args: {
    email: "user@example.com",
    isLoading: true,
    error: null,
  },
};

export const WithError: Story = {
  args: {
    email: "user@example.com",
    isLoading: false,
    error: "このアカウントIDは既に使用されています",
  },
};

export const LongEmail: Story = {
  args: {
    email: "very-long-email-address-for-overflow-test@subdomain.example.com",
    isLoading: false,
    error: null,
  },
};
