import type { Auth0Client } from "@auth0/nextjs-auth0/server";

export type Auth0SessionModule = {
  getAuth0: () => Pick<Auth0Client, "getSession">;
};
