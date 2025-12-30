export interface Username {
  readonly value: string;
}

const maxLength = 255;

const isValidUsername = (username: string): boolean => {
  const trimmed = username.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
};

export const createUsername = (value: string): Username => {
  if (!isValidUsername(value)) {
    throw new Error("Invalid username format");
  }
  return { value };
};
