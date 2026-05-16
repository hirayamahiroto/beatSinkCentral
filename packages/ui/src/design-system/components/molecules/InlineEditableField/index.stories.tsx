import type { Meta, StoryObj } from "@storybook/react-vite";
import { InlineEditableField } from "./index";

const meta = {
  title: "molecules/InlineEditableField",
  component: InlineEditableField,
  parameters: {
    docs: {
      description: {
        component:
          "Label + 表示値 + 編集モード切替 + 入力欄 + 保存/キャンセル/エラー表示を 1 セクションにまとめる molecule。" +
          "自分自身で「読み取り表示モード ↔ 編集モード」の UI 状態を所有し、保存可否（isLoading）とエラー（error）は親から受け取る。" +
          "`onSave` は Promise<boolean> または boolean を返し、true なら自動的に表示モードへ戻る。",
      },
    },
  },
  args: {
    onSave: async () => true,
    isLoading: false,
  },
} satisfies Meta<typeof InlineEditableField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Email",
    htmlFor: "email",
    value: "user@example.com",
    inputType: "email",
  },
  parameters: {
    docs: {
      description: {
        story:
          "標準的な単一フィールドの編集用途。表示モードでは値だけが見え、「変更」ボタンで編集モードに切り替わる。",
      },
    },
  },
};

export const WithPrefix: Story = {
  args: {
    label: "Account ID",
    htmlFor: "accountId",
    value: "dj_taro_123",
    prefix: "@",
  },
  parameters: {
    docs: {
      description: {
        story: "ハンドル名のように接頭辞付きで表示・編集したいケース。",
      },
    },
  },
};

export const WithError: Story = {
  args: {
    label: "Email",
    htmlFor: "email-error",
    value: "user@example.com",
    inputType: "email",
    error: "Invalid email format",
  },
  parameters: {
    docs: {
      description: {
        story:
          "親から渡されたエラーを表示。`aria-invalid` と `aria-describedby` で入力欄と関連付き、スクリーンリーダーがエラーを読み上げる。",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    label: "Email",
    htmlFor: "email-loading",
    value: "user@example.com",
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "保存処理中の状態。入力欄とすべてのボタンが disabled になり、保存ボタンの文言が変わる。",
      },
    },
  },
};
