import type { ProfileEditScreen } from "../../../../../fetchers/dashboard/getProfileEditScreen";
import type { FetcherError } from "../../../../../fetchers/shared/error";
import type { Result } from "../../../../../utils/result";
import { routes } from "../../../../../utils/config/routes";
import type { ScreenView } from "../../../../../views/screenView";
import { resolveReadFailure } from "../../../../../views/resolveReadFailure";

export type ProfileEditData = Extract<ProfileEditScreen, { registered: true }>;

export const resolveProfileEditView = (
  result: Result<ProfileEditScreen, FetcherError>,
): ScreenView<ProfileEditData> => {
  if (!result.ok) return resolveReadFailure(result.error);
  if (!result.value.registered) {
    return { kind: "redirect", to: routes.onboarding };
  }

  return { kind: "render", data: result.value };
};
