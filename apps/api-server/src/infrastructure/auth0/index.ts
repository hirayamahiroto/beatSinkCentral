import {
  createAuth0CookieSessionProvider,
  type SessionProvider,
} from "./sessionProvider";

export const getSessionProvider = (() => {
  let provider: SessionProvider | null = null;

  return (): SessionProvider => {
    if (!provider) {
      const secret = process.env.AUTH0_SECRET;
      if (!secret) {
        throw new Error("AUTH0_SECRET is not defined");
      }
      provider = createAuth0CookieSessionProvider(secret);
    }
    return provider;
  };
})();
