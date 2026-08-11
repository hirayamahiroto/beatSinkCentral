import { describe, it, expect } from "vitest";
import { EncryptJWT } from "jose";
import {
  createAuth0CookieSessionProvider,
  deriveEncryptionKey,
  readSessionCookie,
  readSub,
} from "./index";

const SECRET = "test-secret";
const OTHER_SECRET = "another-secret";

// Auth0 SDK と同じ鍵導出であることを固定値で担保する（info 文字列や digest を変えると Cookie が読めなくなる）
const EXPECTED_KEY_HEX =
  "1e1ac9925546cd9b691965e58b1db4908e73913f7f3032f414ee4614b4a1daca";

type SessionPayload = Record<string, unknown>;

const encryptSession = async (
  payload: SessionPayload,
  secret: string,
  expirationTime: string | number = "1h",
): Promise<string> => {
  const key = await deriveEncryptionKey(secret);
  return new EncryptJWT(payload)
    .setProtectedHeader({ enc: "A256GCM", alg: "dir" })
    .setExpirationTime(expirationTime)
    .encrypt(key);
};

const chunk = (value: string, size: number): string[] => {
  const chunks: string[] = [];
  for (let position = 0; position < value.length; position += size) {
    chunks.push(value.slice(position, position + size));
  }
  return chunks;
};

describe("deriveEncryptionKey", () => {
  it("Auth0 SDK と同じ鍵を導出する", async () => {
    const key = await deriveEncryptionKey(SECRET);

    expect(Buffer.from(key).toString("hex")).toBe(EXPECTED_KEY_HEX);
  });
});

describe("readSessionCookie", () => {
  it("分割されていない __session をそのまま返す", () => {
    expect(readSessionCookie({ __session: "value" })).toBe("value");
  });

  it("分割された __session__N を index 順に結合する", () => {
    expect(
      readSessionCookie({
        __session__1: "world",
        __session__0: "hello",
      }),
    ).toBe("helloworld");
  });

  it("チャンクが欠けている場合は undefined を返す", () => {
    expect(
      readSessionCookie({ __session__0: "hello", __session__2: "world" }),
    ).toBeUndefined();
  });

  it("index が数値でない Cookie はチャンクとして扱わない", () => {
    expect(readSessionCookie({ __session__x: "hello" })).toBeUndefined();
  });

  it("レガシー名 appSession を読む", () => {
    expect(readSessionCookie({ appSession: "value" })).toBe("value");
  });

  it("レガシー名の分割形式 appSession.N を結合する", () => {
    expect(
      readSessionCookie({ "appSession.0": "hello", "appSession.1": "world" }),
    ).toBe("helloworld");
  });

  it("__session を appSession より優先する", () => {
    expect(
      readSessionCookie({ __session: "current", appSession: "legacy" }),
    ).toBe("current");
  });

  it("セッション Cookie が無い場合は undefined を返す", () => {
    expect(readSessionCookie({ other: "value" })).toBeUndefined();
  });
});

describe("readSub", () => {
  it("user.sub を取り出す", () => {
    expect(readSub({ user: { sub: "auth0|abc" } })).toBe("auth0|abc");
  });

  it("user が無い場合は null を返す", () => {
    expect(readSub({})).toBeNull();
  });

  it("user が object でない場合は null を返す", () => {
    expect(readSub({ user: "auth0|abc" })).toBeNull();
  });

  it("sub が文字列でない場合は null を返す", () => {
    expect(readSub({ user: { sub: 1 } })).toBeNull();
  });

  it("sub が空白のみの場合は null を返す", () => {
    expect(readSub({ user: { sub: "   " } })).toBeNull();
  });
});

describe("createAuth0CookieSessionProvider", () => {
  it("Auth0 SDK 形式の Cookie を復号して sub を返す", async () => {
    const cookieValue = await encryptSession(
      { user: { sub: "auth0|abc" } },
      SECRET,
    );
    const provider = createAuth0CookieSessionProvider(SECRET);

    const session = await provider.getSession({ __session: cookieValue });

    expect(session).toStrictEqual({ sub: "auth0|abc" });
  });

  it("分割された Cookie を結合して復号する", async () => {
    const cookieValue = await encryptSession(
      { user: { sub: "auth0|abc" } },
      SECRET,
    );
    const parts = chunk(cookieValue, 20);
    const cookies = Object.fromEntries(
      parts.map((part, index) => [`__session__${index}`, part]),
    );
    const provider = createAuth0CookieSessionProvider(SECRET);

    const session = await provider.getSession(cookies);

    expect(session).toStrictEqual({ sub: "auth0|abc" });
  });

  it("Cookie が無い場合は null を返す", async () => {
    const provider = createAuth0CookieSessionProvider(SECRET);

    expect(await provider.getSession({})).toBeNull();
  });

  it("別の secret で暗号化された Cookie は null を返す", async () => {
    const cookieValue = await encryptSession(
      { user: { sub: "auth0|abc" } },
      OTHER_SECRET,
    );
    const provider = createAuth0CookieSessionProvider(SECRET);

    expect(await provider.getSession({ __session: cookieValue })).toBeNull();
  });

  it("期限切れの Cookie は null を返す", async () => {
    const cookieValue = await encryptSession(
      { user: { sub: "auth0|abc" } },
      SECRET,
      "-1h",
    );
    const provider = createAuth0CookieSessionProvider(SECRET);

    expect(await provider.getSession({ __session: cookieValue })).toBeNull();
  });

  it("復号できても user.sub が無い場合は null を返す", async () => {
    const cookieValue = await encryptSession({ tokenSet: {} }, SECRET);
    const provider = createAuth0CookieSessionProvider(SECRET);

    expect(await provider.getSession({ __session: cookieValue })).toBeNull();
  });

  it("Cookie の値が JWE として壊れている場合は null を返す", async () => {
    const provider = createAuth0CookieSessionProvider(SECRET);

    expect(await provider.getSession({ __session: "not-a-jwe" })).toBeNull();
  });
});
