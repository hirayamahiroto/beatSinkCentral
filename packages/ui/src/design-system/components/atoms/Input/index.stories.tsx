import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./index";

const meta = {
  title: "atoms/Input",
  component: Input,
  parameters: {
    docs: {
      description: {
        component:
          "1 行のテキスト入力を受け取る atom。`type` は HTML 標準（text / email / password / number / search / tel / url など）をそのまま受ける薄いラッパーで、" +
          "ブランドの透過背景と薄いボーダーがデフォルトで当たる。" +
          "単独で使わず、`Label` と必ずペアにして利用者に何の入力かを伝える。" +
          "エラー時は `aria-invalid` と `aria-describedby` を併用し、エラーメッセージを読み上げに含める。",
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: "text",
    placeholder: "例: dj_taro_123",
  },
  parameters: {
    docs: {
      description: {
        story:
          "もっとも基本のテキスト入力。" +
          "`placeholder` は入力例の補助に留め、必須情報（フォーマット規則・必須/任意の区別など）はラベルやヒント文で別途伝える。",
      },
    },
  },
};

export const WithValue: Story = {
  args: {
    type: "text",
    defaultValue: "hirotobeat",
  },
  parameters: {
    docs: {
      description: {
        story:
          "値が入った状態の見た目を確認するための Story。" +
          "`bg-white/5` のため、Card の上に重ねても土台のトーンに自然に馴染む。",
      },
    },
  },
};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "you@example.com",
  },
  parameters: {
    docs: {
      description: {
        story:
          '`type="email"` を指定すると、モバイルで `@` 付きキーボードが出るなどブラウザ側の補助が働く。' +
          "実際のバリデーションは zod 等のスキーマ層で行い、ブラウザ標準の検証には依存しない。",
      },
    },
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "8 文字以上",
  },
  parameters: {
    docs: {
      description: {
        story:
          "パスワード入力。値はマスク表示される。" +
          "強度メーターや表示切替を伴う場合は organism 側で組み立てる。",
      },
    },
  },
};

export const Number: Story = {
  args: {
    type: "number",
    placeholder: "0",
  },
  parameters: {
    docs: {
      description: {
        story:
          "数値入力。スピナーが出る挙動はブラウザ依存。" +
          '金額や ID のように『見た目は数字でも数値演算をしない』ものは `type="text"` の方が事故が少ない。',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    type: "text",
    defaultValue: "編集不可の値",
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "操作不可の状態。" +
          "値を一時的に読み取り専用にしたいだけなら `readOnly` の方が意味的に正しい（フォーム送信に値が含まれる）。",
      },
    },
  },
};

export const ReadOnly: Story = {
  args: {
    type: "text",
    defaultValue: "hirotobeat",
    readOnly: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "編集はできないが値はフォーム送信に含まれる状態。" +
          "登録後に変更不可な ID（アカウント ID 等）の表示などに使用する。",
      },
    },
  },
};

export const Invalid: Story = {
  args: {
    type: "text",
    defaultValue: "invalid value!",
    "aria-invalid": true,
    "aria-describedby": "input-error",
  },
  parameters: {
    docs: {
      description: {
        story:
          "バリデーションエラー時の状態。" +
          "`aria-invalid` を立て、`aria-describedby` でエラーメッセージ要素の id を紐付けることで、" +
          "スクリーンリーダーから入力欄とエラーが対応していると分かる。",
      },
    },
  },
};
