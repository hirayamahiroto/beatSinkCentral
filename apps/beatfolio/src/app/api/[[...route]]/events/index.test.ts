import { describe, it, expect } from "vitest";
import events from "./index";

const routeSurface = () => [
  ...new Set(events.routes.map((route) => `${route.method} ${route.path}`)),
];

describe("/events ルーターの合成", () => {
  it("認証を挟まず配下のエンドポイントを実URLとして公開する", () => {
    expect(routeSurface()).toEqual(["POST /"]);
  });
});
