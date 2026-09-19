const PROFILE_VIEW_FROM_VALUES = [
  "announce",
  "share",
  "search",
  "invite",
  "none",
] as const;

export type ProfileViewFrom = (typeof PROFILE_VIEW_FROM_VALUES)[number];

export const resolveProfileViewFrom = (
  value: string | string[] | undefined,
): ProfileViewFrom => {
  const found = PROFILE_VIEW_FROM_VALUES.find((from) => from === value);
  return found === undefined ? "none" : found;
};
