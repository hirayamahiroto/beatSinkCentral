import { describe, it, expect } from "vitest";
import { toErrorKind, readErrorMessage } from "./index";

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
