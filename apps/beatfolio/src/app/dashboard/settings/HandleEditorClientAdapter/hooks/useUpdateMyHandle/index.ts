import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMyHandle } from "../../../../../../fetchers/artists/updateMyHandle";
import type { FetcherError } from "../../../../../../fetchers/shared/error";
import type { Result } from "../../../../../../utils/result";

type UpdateData = {
  handle: string;
};

export type UpdateMyHandleError = FetcherError;

export type UpdateMyHandleResult = Result<void, UpdateMyHandleError>;

export const useUpdateMyHandle = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const update = async ({
    handle,
  }: UpdateData): Promise<UpdateMyHandleResult> => {
    setIsLoading(true);

    const result = await updateMyHandle({ handle });

    if (result.ok) {
      router.refresh();
    }

    setIsLoading(false);
    return result;
  };

  return { update, isLoading };
};
