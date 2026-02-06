export interface Name {
  readonly value: string;
}

const maxLength = 255;

const isValidName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
};

export const createName = (value: string): Name => {
  if (!isValidName(value)) {
    throw new Error("Invalid name format");
  }
  return { value };
};
