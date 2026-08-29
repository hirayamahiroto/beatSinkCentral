import { z } from "zod";
import { createBeatfolioBffClient } from "../../../utils/client";
import { type Result, ok, err } from "../../../utils/result";
import {
  type FetcherError,
  toErrorKind,
  readErrorMessage,
  NETWORK_ERROR_MESSAGE,
} from "../../shared/error";

const uploadMyProfileImageResponseSchema = z.object({
  imageUrl: z.string().min(1),
});

export type UploadMyProfileImageOutput = z.infer<
  typeof uploadMyProfileImageResponseSchema
>;

const FALLBACK_MESSAGE = "画像のアップロードに失敗しました";

export const uploadMyProfileImage = async (
  file: File,
): Promise<Result<UploadMyProfileImageOutput, FetcherError>> => {
  try {
    const client = createBeatfolioBffClient();
    const res = await client.api.artists.me.profile.image.$post({
      form: { file },
    });

    if (!res.ok) {
      return err({
        kind: toErrorKind(res.status),
        message: await readErrorMessage(res, FALLBACK_MESSAGE),
      });
    }

    const parsed = uploadMyProfileImageResponseSchema.safeParse(
      await res.json(),
    );
    if (!parsed.success) {
      return err({ kind: "unexpected", message: FALLBACK_MESSAGE });
    }

    return ok(parsed.data);
  } catch {
    return err({ kind: "unexpected", message: NETWORK_ERROR_MESSAGE });
  }
};
