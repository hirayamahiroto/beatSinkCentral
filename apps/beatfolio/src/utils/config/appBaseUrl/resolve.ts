export type AppBaseUrlEnv = {
  APP_BASE_URL?: string;
  VERCEL_BRANCH_URL?: string;
  VERCEL_URL?: string;
};

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, "");

export const resolveAppBaseUrl = (
  env: AppBaseUrlEnv,
  localFallback: string,
): string => {
  if (env.APP_BASE_URL) {
    return stripTrailingSlash(env.APP_BASE_URL);
  }
  if (env.VERCEL_BRANCH_URL) {
    return `https://${env.VERCEL_BRANCH_URL}`;
  }
  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }
  return localFallback;
};
