import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextRequest } from "next/server";

const getAuth0 = (() => {
  let client: Auth0Client | null = null;

  return (): Auth0Client => {
    if (!client) {
      client = new Auth0Client();
    }
    return client;
  };
})();

export const getSession = async () => {
  return await getAuth0().getSession();
};

export const getSessionFromRequest = async (req: NextRequest) => {
  return await getAuth0().getSession(req);
};

export const handleAuthRequest = async (req: Request) => {
  return await getAuth0().middleware(req);
};
