export type VisitorIdCookies = {
  anonId: string | undefined;
  sessionId: string | undefined;
};

export type VisitorIds = {
  anonId: string;
  sessionId: string;
};

export const resolveVisitorIds = (
  cookies: VisitorIdCookies,
  generateId: () => string = () => crypto.randomUUID(),
): VisitorIds => ({
  anonId: cookies.anonId ?? generateId(),
  sessionId: cookies.sessionId ?? generateId(),
});
