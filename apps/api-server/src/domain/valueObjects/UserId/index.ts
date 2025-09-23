export interface UserId {
  readonly value: string;
}

const isValidUserId = (id: string): boolean => {
  const userIdRegex = /^user_\d+_[a-z0-9]{9}$/;
  return userIdRegex.test(id) && id.length >= 20 && id.length <= 50;
};

export const createUserId = (value: string): UserId => {
  if (!isValidUserId(value)) {
    throw new Error("Invalid UserId format");
  }
  return { value };
};

export const generateUserId = (): UserId => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 11);
  return { value: `user_${timestamp}_${randomStr}` };
};

export const userIdToJson = (id: UserId): string => id.value;