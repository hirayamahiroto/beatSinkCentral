import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { getAppBaseUrl } from "../appBaseUrl";

export const getAuth0 = (() => {
  let client: Auth0Client | null = null;

  return (): Auth0Client => {
    if (!client) {
      client = new Auth0Client({ appBaseUrl: getAppBaseUrl() });
    }
    return client;
  };
})();
