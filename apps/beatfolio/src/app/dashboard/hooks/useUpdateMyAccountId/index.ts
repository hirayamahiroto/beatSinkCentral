import { useState } from "react";
import { useRouter } from "next/navigation";

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
      const res = await fetch("/api/artists/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Account ID の更新に失敗しました");
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
