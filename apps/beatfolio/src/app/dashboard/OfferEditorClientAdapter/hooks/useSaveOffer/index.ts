import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveMyOffer,
  type SaveMyOfferInput,
} from "../../../../../fetchers/artists/saveMyOffer";

export const useSaveOffer = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (input: SaveMyOfferInput): Promise<void> => {
    setIsLoading(true);
    setError(null);

    const result = await saveMyOffer(input);

    setIsLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    router.refresh();
  };

  return { save, isLoading, error };
};
