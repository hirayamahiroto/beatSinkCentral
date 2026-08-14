import { describe, it, expect } from "vitest";
import linkTypes from "./index";

const routeSurface = () => [
  ...new Set(linkTypes.routes.map((route) => `${route.method} ${route.path}`)),
];

describe("/link-types ルーターの合成", () => {
  it("認証を挟まず配下のエンドポイントを実 URL として公開する", () => {
    expect(routeSurface()).toEqual(["GET /"]);
  });
});
