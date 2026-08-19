export type UpstreamUnavailableError = Error & {
  readonly type: "UpstreamUnavailableError";
};

export const createUpstreamUnavailableError = (
  cause: unknown,
): UpstreamUnavailableError =>
  Object.assign(new Error("UpstreamUnavailableError", { cause }), {
    type: "UpstreamUnavailableError" as const,
  });

export const isUpstreamUnavailableError = (
  error: unknown,
): error is UpstreamUnavailableError =>
  error instanceof Error &&
  "type" in error &&
  error.type === "UpstreamUnavailableError";
