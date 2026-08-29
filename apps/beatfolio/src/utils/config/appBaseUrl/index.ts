import { resolveAppBaseUrl } from "./resolve";

const LOCAL_APP_BASE_URL = "http://localhost:3000";

export const getAppBaseUrl = (): string =>
  resolveAppBaseUrl(
    {
      APP_BASE_URL: process.env.APP_BASE_URL,
      VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
      VERCEL_URL: process.env.VERCEL_URL,
    },
    LOCAL_APP_BASE_URL,
  );
