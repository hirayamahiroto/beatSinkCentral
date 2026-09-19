import { useState } from "react";
import { useRouter } from "next/navigation";
import { choosePresentationPattern } from "../../../../../fetchers/artists/choosePresentationPattern";

export const useChoosePresentationPattern = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (patternCode: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    const result = await choosePresentationPattern({ patternCode });

    setIsLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    router.refresh();
  };

  return { choose, isLoading, error };
};
