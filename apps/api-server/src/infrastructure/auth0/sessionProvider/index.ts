import { hkdf } from "@panva/hkdf";
import { jwtDecrypt, type JWTPayload } from "jose";

export type AuthSession = {
  sub: string;
};

export type SessionProvider = {
  getSession: (cookies: Record<string, string>) => Promise<AuthSession | null>;
};

// Auth0 SDK が発行するセッション Cookie の形式に合わせる必要があるため、SDK 側の定義値を写している
// 出所: @auth0/nextjs-auth0 の dist/server/cookies.js / dist/server/session/abstract-session-store.js
const SESSION_COOKIE_NAME = "__session";
const SESSION_COOKIE_CHUNK_SEPARATOR = "__";
const LEGACY_SESSION_COOKIE_NAME = "appSession";
const LEGACY_SESSION_COOKIE_CHUNK_SEPARATOR = ".";
const KEY_DERIVATION_DIGEST = "sha256";
const KEY_DERIVATION_INFO = "JWE CEK";
const KEY_BYTE_LENGTH = 32;
const CLOCK_TOLERANCE_SECONDS = 15;

const CHUNK_INDEX_PATTERN = /^(0|[1-9][0-9]*)$/;

type SessionCookieChunk = {
  index: number;
  value: string;
};

const collectChunks = (
  cookies: Record<string, string>,
  prefix: string,
): SessionCookieChunk[] => {
  const chunks: SessionCookieChunk[] = [];
  for (const [name, value] of Object.entries(cookies)) {
    if (!name.startsWith(prefix)) continue;
    const suffix = name.slice(prefix.length);
    if (!CHUNK_INDEX_PATTERN.test(suffix)) continue;
    chunks.push({ index: Number(suffix), value });
  }
  return chunks;
};

const joinChunks = (chunks: SessionCookieChunk[]): string | undefined => {
  if (chunks.length === 0) return undefined;
  const ordered = [...chunks].sort((left, right) => left.index - right.index);
  const isContiguous = ordered.every(
    (chunk, position) => chunk.index === position,
  );
  if (!isContiguous) return undefined;
  return ordered.map((chunk) => chunk.value).join("");
};

const readCookie = (
  cookies: Record<string, string>,
  name: string,
  chunkSeparator: string,
): string | undefined => {
  const unchunked = cookies[name];
  if (unchunked !== undefined) return unchunked;
  return joinChunks(collectChunks(cookies, `${name}${chunkSeparator}`));
};

export const readSessionCookie = (
  cookies: Record<string, string>,
): string | undefined => {
  const current = readCookie(
    cookies,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_CHUNK_SEPARATOR,
  );
  if (current !== undefined) return current;
  return readCookie(
    cookies,
    LEGACY_SESSION_COOKIE_NAME,
    LEGACY_SESSION_COOKIE_CHUNK_SEPARATOR,
  );
};

export const readSub = (payload: JWTPayload): string | null => {
  const user = payload.user;
  if (typeof user !== "object" || user === null) return null;
  if (!("sub" in user)) return null;
  const sub = user.sub;
  if (typeof sub !== "string") return null;
  if (sub.trim().length === 0) return null;
  return sub;
};

export const deriveEncryptionKey = (secret: string): Promise<Uint8Array> =>
  hkdf(KEY_DERIVATION_DIGEST, secret, "", KEY_DERIVATION_INFO, KEY_BYTE_LENGTH);

const decryptSession = async (
  cookieValue: string,
  encryptionKey: Uint8Array,
): Promise<JWTPayload | null> => {
  try {
    const { payload } = await jwtDecrypt(cookieValue, encryptionKey, {
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
    });
    return payload;
  } catch {
    return null;
  }
};

export const createAuth0CookieSessionProvider = (
  secret: string,
): SessionProvider => {
  let encryptionKey: Promise<Uint8Array> | null = null;

  const getEncryptionKey = (): Promise<Uint8Array> => {
    if (encryptionKey === null) {
      encryptionKey = deriveEncryptionKey(secret);
    }
    return encryptionKey;
  };

  return {
    async getSession(cookies) {
      const cookieValue = readSessionCookie(cookies);
      if (cookieValue === undefined) return null;

      const payload = await decryptSession(
        cookieValue,
        await getEncryptionKey(),
      );
      if (payload === null) return null;

      const sub = readSub(payload);
      if (sub === null) return null;

      return { sub };
    },
  };
};
