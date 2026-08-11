const POSTGRES_UNIQUE_VIOLATION_CODE = "23505";

export const isUniqueViolation = (
  error: unknown,
  constraintName: string,
): boolean => {
  if (!(error instanceof Error)) return false;
  const { code, constraint_name } = error as Partial<{
    code: string;
    constraint_name: string;
  }>;
  return (
    code === POSTGRES_UNIQUE_VIOLATION_CODE &&
    constraint_name === constraintName
  );
};
