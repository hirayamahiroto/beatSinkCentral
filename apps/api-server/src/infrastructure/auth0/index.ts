import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const getAuth0 = (() => {
  let client: Auth0Client | null = null;

  return (): Auth0Client => {
    if (!client) {
      client = new Auth0Client();
    }
    return client;
  };
})();
