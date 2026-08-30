import { z } from "zod";
import { createBeatfolioBffClient } from "../../../utils/client";
import { type Result, ok, err } from "../../../utils/result";
import {
  type FetcherError,
  toErrorKind,
  NETWORK_ERROR_MESSAGE,
} from "../../shared/error";

const FALLBACK_MESSAGE = "プロフィールの公開に失敗しました";
const NOT_PUBLISHABLE_MESSAGE = "公開に必要な項目が足りません";

export type PublishMyProfileError = FetcherError & {
  missingRequirements: string[] | null;
};

const errorBodySchema = z.object({
  error: z.string().min(1),
  missingRequirements: z.array(z.string()).optional(),
});

const readError = async (res: {
  status: number;
  json: () => Promise<unknown>;
}): Promise<PublishMyProfileError> => {
  const kind = toErrorKind(res.status);

  try {
    const parsed = errorBodySchema.safeParse(await res.json());

    if (!parsed.success) {
      return { kind, message: FALLBACK_MESSAGE, missingRequirements: null };
    }

    const { error, missingRequirements } = parsed.data;

    return missingRequirements
      ? { kind, message: NOT_PUBLISHABLE_MESSAGE, missingRequirements }
      : { kind, message: error, missingRequirements: null };
  } catch {
    return { kind, message: FALLBACK_MESSAGE, missingRequirements: null };
  }
};

export const publishMyProfile = async (input: {
  published: boolean;
}): Promise<Result<void, PublishMyProfileError>> => {
  try {
    const client = createBeatfolioBffClient();
    const res = await client.api.artists.me.profile.publish.$post({
      json: input,
    });

    if (!res.ok) {
      return err(await readError(res));
    }

    return ok(undefined);
  } catch {
    return err({
      kind: "unexpected",
      message: NETWORK_ERROR_MESSAGE,
      missingRequirements: null,
    });
  }
};
