import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMyAccountId } from "../../../../../../fetchers/artists/updateMyAccountId";
import type { FetcherError } from "../../../../../../fetchers/shared/error";
import type { Result } from "../../../../../../utils/result";

type UpdateData = {
  accountId: string;
};

export type UpdateMyAccountIdError = FetcherError;

export type UpdateMyAccountIdResult = Result<void, UpdateMyAccountIdError>;

export const useUpdateMyAccountId = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const update = async ({
    accountId,
  }: UpdateData): Promise<UpdateMyAccountIdResult> => {
    setIsLoading(true);

    const result = await updateMyAccountId({ accountId });

    if (result.ok) {
      router.refresh();
    }

    setIsLoading(false);
    return result;
  };

  return { update, isLoading };
};
