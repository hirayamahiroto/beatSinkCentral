export type Sub = {
  readonly value: string;
};

const isValidSub = (sub: string): boolean => {
  return sub.trim().length > 0;
};

export const createSub = (value: string): Sub => {
  if (!value || !isValidSub(value)) {
    throw new Error("sub is required");
  }
  return { value };
};
