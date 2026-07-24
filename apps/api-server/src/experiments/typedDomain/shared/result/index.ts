export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const map = <T, U, E>(
  result: Result<T, E>,
  f: (value: T) => U,
): Result<U, E> => (result.ok ? ok(f(result.value)) : result);

export const flatMap = <T, U, E1, E2>(
  result: Result<T, E1>,
  f: (value: T) => Result<U, E2>,
): Result<U, E1 | E2> => (result.ok ? f(result.value) : result);
