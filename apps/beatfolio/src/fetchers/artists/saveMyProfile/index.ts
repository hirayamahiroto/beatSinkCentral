import type { InferRequestType } from "hono/client";
import { createBeatfolioBffClient } from "../../../utils/client";
import { type Result, ok, err } from "../../../utils/result";
import {
  type FetcherError,
  toErrorKind,
  readErrorMessageFromBody,
  NETWORK_ERROR_MESSAGE,
} from "../../shared/error";
import {
  saveStepProgressSchema,
  type SaveStepProgress,
} from "../../../libs/saveProfileProgress";

type BffClient = ReturnType<typeof createBeatfolioBffClient>;

export type SaveMyProfileInput = InferRequestType<
  BffClient["api"]["artists"]["me"]["profile"]["$post"]
>["json"];

export type SaveMyProfileError = FetcherError & {
  progress: SaveStepProgress | null;
};

const FALLBACK_MESSAGE = "プロフィールの保存に失敗しました";

const readProgress = (body: unknown): SaveStepProgress | null => {
  const parsed = saveStepProgressSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
};

const readBody = async (res: { json: () => Promise<unknown> }) => {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
};

export const saveMyProfile = async (
  input: SaveMyProfileInput,
): Promise<Result<void, SaveMyProfileError>> => {
  try {
    const client = createBeatfolioBffClient();
    const res = await client.api.artists.me.profile.$post({ json: input });

    if (!res.ok) {
      const body = await readBody(res);
      return err({
        kind: toErrorKind(res.status),
        message: readErrorMessageFromBody(body, FALLBACK_MESSAGE),
        progress: readProgress(body),
      });
    }

    return ok(undefined);
  } catch {
    return err({
      kind: "unexpected",
      message: NETWORK_ERROR_MESSAGE,
      progress: null,
    });
  }
};
