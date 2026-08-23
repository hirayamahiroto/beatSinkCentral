import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMyEmail } from "../../../../../../fetchers/users/updateMyEmail";
import type { FetcherError } from "../../../../../../fetchers/shared/error";
import type { Result } from "../../../../../../utils/result";

type UpdateData = {
  email: string;
};

export type UpdateMyEmailError = FetcherError;

export type UpdateMyEmailResult = Result<void, UpdateMyEmailError>;

export const useUpdateMyEmail = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const update = async ({
    email,
  }: UpdateData): Promise<UpdateMyEmailResult> => {
    setIsLoading(true);

    const result = await updateMyEmail({ email });

    if (result.ok) {
      router.refresh();
    }

    setIsLoading(false);
    return result;
  };

  return { update, isLoading };
};
