import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBeatfolioBffClient } from "../../../../utils/client";

type UpdateData = {
  email: string;
};

export const useUpdateMyEmail = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async ({ email }: UpdateData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const client = createBeatfolioBffClient();
      const res = await client.api.users.me.$post({ json: { email } });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "メールアドレスの更新に失敗しました");
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
