import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";
import { createBeatfolioBffClient } from "../../../../../../utils/client";
import { toSaveProfileRequest } from "../../toSaveProfileRequest";

const run = async (
  values: WizardValues,
  options: { publish: boolean },
): Promise<void> => {
  const client = createBeatfolioBffClient();

  const saveRes = await client.api.artists.me.profile.$post({
    json: toSaveProfileRequest(values),
  });
  if (!saveRes.ok) {
    const data = (await saveRes.json()) as { error?: string };
    throw new Error(data.error || "プロフィールの保存に失敗しました");
  }

  if (!options.publish) return;

  const publishRes = await client.api.artists.me.profile.publish.$post({
    json: { published: true },
  });
  if (!publishRes.ok) {
    const data = (await publishRes.json()) as { error?: string };
    throw new Error(data.error || "プロフィールの公開に失敗しました");
  }
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

    try {
      await run(values, options);
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const submit = (values: WizardValues): Promise<boolean> =>
    save(values, { publish: values.published });

  const saveDraft = (values: WizardValues): Promise<boolean> =>
    save(values, { publish: false });

  return { submit, saveDraft, isLoading, error };
};
