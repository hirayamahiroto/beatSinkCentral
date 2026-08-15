import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createBeatfolioBffClient } from "../../../../../../utils/client";

type UpdateData = {
  email: string;
};

export type UpdateMyEmailResult =
  | { ok: true }
  | { ok: false; kind: "rejected" | "unexpected"; message: string };

const FALLBACK_MESSAGE = "メールアドレスの更新に失敗しました";

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

export const useUpdateMyEmail = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const update = async ({
    email,
  }: UpdateData): Promise<UpdateMyEmailResult> => {
    setIsLoading(true);

    try {
      const client = createBeatfolioBffClient();
      const res = await client.api.users.me.$post({ json: { email } });

      if (!res.ok) {
        return {
          ok: false,
          kind: REJECTED_STATUSES.includes(res.status)
            ? "rejected"
            : "unexpected",
          message: await readErrorMessage(res),
        };
      }

      router.refresh();
      return { ok: true };
    } catch {
      return {
        ok: false,
        kind: "unexpected",
        message: "通信に失敗しました。時間をおいて再度お試しください",
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { update, isLoading };
};
