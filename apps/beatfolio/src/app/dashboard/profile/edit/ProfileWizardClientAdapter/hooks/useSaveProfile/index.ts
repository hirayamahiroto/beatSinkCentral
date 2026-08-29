import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { saveMyProfile } from "../../../../../../../fetchers/artists/saveMyProfile";
import { publishMyProfile } from "../../../../../../../fetchers/artists/publishMyProfile";
import type { FetcherError } from "../../../../../../../fetchers/shared/error";
import { type Result, ok } from "../../../../../../../utils/result";
import { toSaveProfileRequest } from "../../toSaveProfileRequest";

const run = async (
  values: WizardValues,
  options: { publish: boolean },
): Promise<Result<void, FetcherError>> => {
  const saved = await saveMyProfile(toSaveProfileRequest(values));
  if (!saved.ok) return saved;

  if (!options.publish) return ok(undefined);

  return publishMyProfile({ published: true });
};

export const useSaveProfile = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (
    values: WizardValues,
    options: { publish: boolean },
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const result = await run(values, options);

    setIsLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    router.refresh();
    return true;
  };

  const submit = (values: WizardValues): Promise<boolean> =>
    save(values, { publish: true });

  const saveDraft = (values: WizardValues): Promise<boolean> =>
    save(values, { publish: false });

  return { submit, saveDraft, isLoading, error };
};
