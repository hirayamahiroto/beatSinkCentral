export type InsecureBffBaseUrlError = Error & {
  readonly type: "InsecureBffBaseUrlError";
};

export const createInsecureBffBaseUrlError = (): InsecureBffBaseUrlError =>
  Object.assign(new Error("InsecureBffBaseUrlError"), {
    type: "InsecureBffBaseUrlError" as const,
  });
