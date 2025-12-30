export type Auth0UserId = {
  readonly value: string;
};

const isValidAuth0UserId = (auth0UserId: string): boolean => {
  return auth0UserId.trim().length > 0;
};

export const createAuth0UserId = (value: string): Auth0UserId => {
  if (!value || !isValidAuth0UserId(value)) {
    throw new Error("auth0UserId is required");
  }
  return { value };
};
