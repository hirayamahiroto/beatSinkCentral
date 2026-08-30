import type { FetcherError } from "../../fetchers/shared/error";
import { routes } from "../../utils/config/routes";
import type { FailureView } from "../screenView";

export const resolveReadFailure = (error: FetcherError): FailureView => {
  switch (error.kind) {
    case "unauthorized":
      return { kind: "redirect", to: routes.auth.login };
    case "notFound":
      return { kind: "notFound" };
    case "rejected":
      return {
        kind: "degraded",
        feedback: { message: error.message, recovery: { kind: "none" } },
      };
    case "unexpected":
      return {
        kind: "degraded",
        feedback: { message: error.message, recovery: { kind: "retry" } },
      };
  }
};
