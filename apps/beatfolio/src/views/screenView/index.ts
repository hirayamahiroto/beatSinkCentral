import type { Feedback } from "../../feedback";

export type ScreenView<Data> =
  | { kind: "redirect"; to: string }
  | { kind: "notFound" }
  | { kind: "degraded"; feedback: Feedback }
  | { kind: "render"; data: Data };

export type FailureView = Exclude<ScreenView<never>, { kind: "render" }>;
