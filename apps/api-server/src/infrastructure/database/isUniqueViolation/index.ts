const POSTGRES_UNIQUE_VIOLATION = "23505";

const hasUniqueViolationCode = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code: unknown }).code === POSTGRES_UNIQUE_VIOLATION;

export const isUniqueViolation = (error: unknown): boolean => {
  if (hasUniqueViolationCode(error)) return true;
  const cause = (error as { cause?: unknown } | null)?.cause;
  return cause !== undefined && hasUniqueViolationCode(cause);
};
