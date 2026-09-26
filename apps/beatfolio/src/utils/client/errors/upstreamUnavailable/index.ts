export type UpstreamUnavailableError = Error & {
  readonly type: "UpstreamUnavailableError";
};

export const createUpstreamUnavailableError = (
  cause: unknown,
): UpstreamUnavailableError =>
  Object.assign(new Error("UpstreamUnavailableError", { cause }), {
    type: "UpstreamUnavailableError" as const,
  });
