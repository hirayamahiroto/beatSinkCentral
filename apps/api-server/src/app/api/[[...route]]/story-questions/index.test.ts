import { describe, it, expect } from "vitest";
import storyQuestions from "./index";

const routeSurface = () => [
  ...new Set(
    storyQuestions.routes.map((route) => `${route.method} ${route.path}`),
  ),
];

describe("/story-questions ルーターの合成", () => {
  it("認証を挟まず配下のエンドポイントを実 URL として公開する", () => {
    expect(routeSurface()).toEqual(["GET /"]);
  });
});
