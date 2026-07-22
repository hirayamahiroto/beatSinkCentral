import { useState } from "react";
import { useRouter } from "next/navigation";

type UseCreateUserParams = {
  email: string;
};

type SubmitData = {
  accountId: string;
};

export const useCreateUser = ({ email }: UseCreateUserParams) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async ({ accountId }: SubmitData) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, accountId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ユーザー作成に失敗しました");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit, isLoading, error };
};
