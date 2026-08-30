import type { Meta, StoryObj } from "@storybook/react-vite";
import { FailureNotice } from "./index";

const meta = {
  title: "molecules/FailureNotice",
  component: FailureNotice,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "取得に失敗した領域に「何が起きたか」と「次の動き（再試行 / 別動線）」を示す molecule。" +
          "取得失敗を空データとして描かないための受け皿であり、文言・再試行の実体・遷移先は" +
          "呼び出し側（app 層）から props で受け取る。",
      },
    },
  },
} satisfies Meta<typeof FailureNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderLink = ({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <a href={href} className={className}>
    {children}
  </a>
);

export const WithRetry: Story = {
  args: {
    title: "読み込めませんでした",
    message: "プレイヤー一覧の取得に失敗しました",
    retry: { label: "再試行する", onRetry: () => {} },
    links: [{ href: "/", label: "トップへ戻る" }],
    renderLink,
  },
};

export const WithoutRetry: Story = {
  args: {
    ...WithRetry.args,
    message: "お探しのページは見つかりませんでした",
    retry: undefined,
  },
};

export const MultipleLinks: Story = {
  args: {
    ...WithRetry.args,
    links: [
      { href: "/", label: "トップへ戻る" },
      { href: "/dashboard", label: "ダッシュボードへ" },
    ],
  },
};
