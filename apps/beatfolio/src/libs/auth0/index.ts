import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextRequest } from "next/server";

export const auth0 = new Auth0Client();

export const getSession = async () => {
  return await auth0.getSession();
};

export const getSessionFromRequest = async (req: NextRequest) => {
  return await auth0.getSession(req);
};
