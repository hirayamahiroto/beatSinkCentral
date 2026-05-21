import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBeatfolioBffClient } from "../../../../utils/client";

type UpdateData = {
  accountId: string;
};

export const useUpdateMyAccountId = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async ({ accountId }: UpdateData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const client = createBeatfolioBffClient();
      const res = await client.api.artists.me.$post({ json: { accountId } });

      if (!res.ok) {
        let message = "Account ID の更新に失敗しました";
        try {
          const data = (await res.json()) as { error?: string };
          if (typeof data.error === "string" && data.error.length > 0) {
            message = data.error;
          }
        } catch {
          // 非JSON/空レスポンス時は既定メッセージを使う
        }
        throw new Error(message);
      }

      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { update, isLoading, error };
};
