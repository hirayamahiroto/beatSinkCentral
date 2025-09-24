export interface Email {
  readonly value: string;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const createEmail = (value: string): Email => {
  if (!isValidEmail(value)) {
    throw new Error("Invalid email format");
  }
  return { value };
};

export const emailToJson = (email: Email): string => email.value;
