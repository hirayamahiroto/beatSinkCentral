import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishMyProfile } from "../../../../../fetchers/artists/publishMyProfile";

export const usePublishProfile = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectedRequirements, setRejectedRequirements] = useState<
    string[] | null
  >(null);

  const setPublished = async (published: boolean): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setRejectedRequirements(null);

    const result = await publishMyProfile({ published });

    setIsLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      setRejectedRequirements(result.error.missingRequirements);
      return;
    }

    router.refresh();
  };

  return { setPublished, isLoading, error, rejectedRequirements };
};
