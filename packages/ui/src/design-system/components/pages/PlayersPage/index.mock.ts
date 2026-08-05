import image1 from "../../../../../.storybook/assets/images/image1.jpeg";
import image2 from "../../../../../.storybook/assets/images/image2.jpeg";
import image3 from "../../../../../.storybook/assets/images/image3.jpeg";
import type { Player } from "./index";

export const players: Player[] = [
  {
    accountId: "hiroto",
    name: "HIROTO",
    imageUrl: image1 as unknown as string,
  },
  {
    accountId: "kazuki",
    name: "Kazuki",
    imageUrl: image2 as unknown as string,
  },
  {
    accountId: "yuto",
    name: "Yuto",
    imageUrl: image3 as unknown as string,
  },
  {
    accountId: "no_image",
    name: "写真未登録のプレイヤー",
    imageUrl: null,
  },
];

export { image1, image2, image3 };
