import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { saveMyProfile } from "../../../../../../../fetchers/artists/saveMyProfile";
import { toSaveProfileRequest } from "../../toSaveProfileRequest";

const DASHBOARD_PATH = "/dashboard";

export const useSaveProfile = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (values: WizardValues): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const result = await saveMyProfile(toSaveProfileRequest(values));

    setIsLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    return true;
  };

  const submit = async (values: WizardValues): Promise<boolean> => {
    const saved = await save(values);
    if (saved) router.push(DASHBOARD_PATH);
    return saved;
  };

  const saveDraft = async (values: WizardValues): Promise<boolean> => {
    const saved = await save(values);
    if (saved) router.refresh();
    return saved;
  };

  return { submit, saveDraft, isLoading, error };
};
