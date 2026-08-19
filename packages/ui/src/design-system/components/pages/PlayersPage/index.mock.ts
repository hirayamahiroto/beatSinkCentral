import type { Player } from "./index";

const imageUrl = (fileName: string): string =>
  new URL(
    `../../../../../.storybook/assets/images/${fileName}`,
    import.meta.url,
  ).href;

export const players: Player[] = [
  {
    accountId: "hiroto",
    name: "HIROTO",
    imageUrl: imageUrl("image1.jpeg"),
  },
  {
    accountId: "kazuki",
    name: "Kazuki",
    imageUrl: imageUrl("image2.jpeg"),
  },
  {
    accountId: "yuto",
    name: "Yuto",
    imageUrl: imageUrl("image3.jpeg"),
  },
  {
    accountId: "no_image",
    name: "写真未登録のプレイヤー",
    imageUrl: null,
  },
];
