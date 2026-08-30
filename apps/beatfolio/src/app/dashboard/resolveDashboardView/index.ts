import type { DashboardScreen } from "../../../fetchers/dashboard/getDashboard";
import type { FetcherError } from "../../../fetchers/shared/error";
import type { Result } from "../../../utils/result";
import { routes } from "../../../utils/config/routes";
import type { ScreenView } from "../../../views/screenView";
import { resolveReadFailure } from "../../../views/resolveReadFailure";

export type DashboardData = Extract<DashboardScreen, { registered: true }>;

export const resolveDashboardView = (
  result: Result<DashboardScreen, FetcherError>,
): ScreenView<DashboardData> => {
  if (!result.ok) return resolveReadFailure(result.error);
  if (!result.value.registered) {
    return { kind: "redirect", to: routes.onboarding };
  }

  return { kind: "render", data: result.value };
};
