import type { SettingsScreen } from "../../../../fetchers/dashboard/getSettings";
import type { FetcherError } from "../../../../fetchers/shared/error";
import type { Result } from "../../../../utils/result";
import { routes } from "../../../../utils/config/routes";
import type { ScreenView } from "../../../../views/screenView";
import { resolveReadFailure } from "../../../../views/resolveReadFailure";

export type SettingsData = Extract<SettingsScreen, { registered: true }>;

export const resolveSettingsView = (
  result: Result<SettingsScreen, FetcherError>,
): ScreenView<SettingsData> => {
  if (!result.ok) return resolveReadFailure(result.error);
  if (!result.value.registered) {
    return { kind: "redirect", to: routes.onboarding };
  }

  return { kind: "render", data: result.value };
};
