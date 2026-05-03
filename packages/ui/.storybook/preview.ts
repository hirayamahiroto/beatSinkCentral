import type { Preview } from "@storybook/react-vite";
import { themes } from "storybook/theming";
import "../global.css";

const preview: Preview = {
  parameters: {
    docs: {
      // dark-first ブランドに合わせて Docs ページもダークテーマで描画する
      theme: themes.dark,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },

  tags: ["autodocs"],
};

export default preview;
