import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createBeatfolioBffClient } from "../../../../../../utils/client";
import { type Result, ok, err } from "../../../../../../utils/result";

type UpdateData = {
  accountId: string;
};

export type UpdateMyAccountIdError = {
  kind: "rejected" | "unexpected";
  message: string;
};

export type UpdateMyAccountIdResult = Result<void, UpdateMyAccountIdError>;

const FALLBACK_MESSAGE = "Account ID の更新に失敗しました";

const NETWORK_MESSAGE = "通信に失敗しました。時間をおいて再度お試しください";

const REJECTED_STATUSES = [400, 409, 422];

const errorBodySchema = z.object({ error: z.string().min(1) });

const readErrorMessage = async (res: {
  json: () => Promise<unknown>;
}): Promise<string> => {
  try {
    const parsed = errorBodySchema.safeParse(await res.json());
    return parsed.success ? parsed.data.error : FALLBACK_MESSAGE;
  } catch {
    return FALLBACK_MESSAGE;
  }
};

export const useUpdateMyAccountId = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const update = async ({
    accountId,
  }: UpdateData): Promise<UpdateMyAccountIdResult> => {
    setIsLoading(true);

    try {
      const client = createBeatfolioBffClient();
      const res = await client.api.artists.me.$post({ json: { accountId } });

      if (!res.ok) {
        return err({
          kind: REJECTED_STATUSES.includes(res.status)
            ? "rejected"
            : "unexpected",
          message: await readErrorMessage(res),
        });
      }

      router.refresh();
      return ok(undefined);
    } catch {
      return err({ kind: "unexpected", message: NETWORK_MESSAGE });
    } finally {
      setIsLoading(false);
    }
  };

  return { update, isLoading };
};
