const POSTGRES_UNIQUE_VIOLATION_CODE = "23505";

export const isUniqueViolation = (
  error: unknown,
  constraintName: string,
): boolean => {
  if (!(error instanceof Error)) return false;
  return (
    "code" in error &&
    error.code === POSTGRES_UNIQUE_VIOLATION_CODE &&
    "constraint_name" in error &&
    error.constraint_name === constraintName
  );
};
