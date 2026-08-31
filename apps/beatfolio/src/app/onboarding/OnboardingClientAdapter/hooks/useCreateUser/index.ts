import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "../../../../../fetchers/users/createUser";

type UseCreateUserParams = {
  email: string;
};

type SubmitData = {
  handle: string;
};

export const useCreateUser = ({ email }: UseCreateUserParams) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async ({ handle }: SubmitData) => {
    setIsLoading(true);
    setError(null);

    const result = await createUser({ email, handle });

    if (result.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError(result.error.message);
    }

    setIsLoading(false);
  };

  return { handleSubmit, isLoading, error };
};
