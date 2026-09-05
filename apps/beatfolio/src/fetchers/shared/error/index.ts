import { z } from "zod";

export type FetcherError = {
  kind: "rejected" | "notFound" | "unexpected";
  message: string;
};

export const NETWORK_ERROR_MESSAGE =
  "通信に失敗しました。時間をおいて再度お試しください";

const REJECTED_STATUSES = [400, 409, 422];

export const toErrorKind = (status: number): FetcherError["kind"] =>
  REJECTED_STATUSES.includes(status) ? "rejected" : "unexpected";

const errorBodySchema = z.object({ error: z.string().min(1) });

export const readErrorMessageFromBody = (
  body: unknown,
  fallback: string,
): string => {
  const parsed = errorBodySchema.safeParse(body);
  return parsed.success ? parsed.data.error : fallback;
};

export const readErrorMessage = async (
  res: { json: () => Promise<unknown> },
  fallback: string,
): Promise<string> => {
  try {
    return readErrorMessageFromBody(await res.json(), fallback);
  } catch {
    return fallback;
  }
};
