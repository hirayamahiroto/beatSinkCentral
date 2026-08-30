import { z } from "zod";

export type FetcherError = {
  kind: "rejected" | "notFound" | "unauthorized" | "unexpected";
  message: string;
};

export const NETWORK_ERROR_MESSAGE =
  "通信に失敗しました。時間をおいて再度お試しください";

export const SESSION_EXPIRED_MESSAGE =
  "ログインの有効期限が切れました。もう一度ログインしてください";

const REJECTED_STATUSES = [400, 409, 422];

export const toErrorKind = (status: number): FetcherError["kind"] =>
  REJECTED_STATUSES.includes(status) ? "rejected" : "unexpected";

export const toReadFetcherError = (
  status: number,
  fallbackMessage: string,
): FetcherError =>
  status === 401
    ? { kind: "unauthorized", message: SESSION_EXPIRED_MESSAGE }
    : { kind: "unexpected", message: fallbackMessage };

const errorBodySchema = z.object({ error: z.string().min(1) });

export const readErrorMessage = async (
  res: { json: () => Promise<unknown> },
  fallback: string,
): Promise<string> => {
  try {
    const parsed = errorBodySchema.safeParse(await res.json());
    return parsed.success ? parsed.data.error : fallback;
  } catch {
    return fallback;
  }
};
