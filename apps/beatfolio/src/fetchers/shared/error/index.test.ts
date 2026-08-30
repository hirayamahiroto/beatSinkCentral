import { describe, it, expect } from "vitest";
import {
  toErrorKind,
  toReadFetcherError,
  readErrorMessage,
  SESSION_EXPIRED_MESSAGE,
} from "./index";

describe("toErrorKind", () => {
  it.each([400, 409, 422])(
    "%s はユーザー起因の rejected に分類する",
    (status) => {
      expect(toErrorKind(status)).toBe("rejected");
    },
  );

  it.each([401, 404, 500, 502])("%s は unexpected に分類する", (status) => {
    expect(toErrorKind(status)).toBe("unexpected");
  });
});

describe("toReadFetcherError", () => {
  it("401 はログインし直せば直る失敗として unauthorized に分類する", () => {
    expect(toReadFetcherError(401, "取得に失敗しました")).toStrictEqual({
      kind: "unauthorized",
      message: SESSION_EXPIRED_MESSAGE,
    });
  });

  it.each([404, 500, 502])(
    "%s は画面側で縮退させる unexpected に分類する",
    (status) => {
      expect(toReadFetcherError(status, "取得に失敗しました")).toStrictEqual({
        kind: "unexpected",
        message: "取得に失敗しました",
      });
    },
  );
});

describe("readErrorMessage", () => {
  it("エラーボディの error メッセージを返す", async () => {
    const res = { json: async () => ({ error: "accountId already taken" }) };

    expect(await readErrorMessage(res, "fallback")).toBe(
      "accountId already taken",
    );
  });

  it("契約外のボディなら fallback を返す", async () => {
    const res = { json: async () => ({ message: "oops" }) };

    expect(await readErrorMessage(res, "fallback")).toBe("fallback");
  });

  it("ボディが解析できなければ fallback を返す", async () => {
    const res = {
      json: async () => {
        throw new Error("invalid json");
      },
    };

    expect(await readErrorMessage(res, "fallback")).toBe("fallback");
  });
});
