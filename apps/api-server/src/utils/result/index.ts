export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const map = <T, U, E>(
  result: Result<T, E>,
  f: (value: T) => U,
): Result<U, E> => (result.ok ? ok(f(result.value)) : result);

export const traverse = <T, U, E>(
  items: readonly T[],
  f: (item: T) => Result<U, E>,
): Result<U[], E> => {
  const values: U[] = [];
  for (const item of items) {
    const result = f(item);
    if (!result.ok) return result;
    values.push(result.value);
  }
  return ok(values);
};

type ResultRecord = Record<string, Result<unknown, unknown>>;

type ValueOf<R> = R extends { readonly ok: true; readonly value: infer T }
  ? T
  : never;

type ErrorOf<R> = R extends { readonly ok: false; readonly error: infer E }
  ? E
  : never;

export const all = <Fields extends ResultRecord>(
  fields: Fields,
): Result<
  { [K in keyof Fields]: ValueOf<Fields[K]> },
  ErrorOf<Fields[keyof Fields]>
> => {
  const values: Record<string, unknown> = {};

  for (const [key, result] of Object.entries(fields)) {
    if (!result.ok) return err(result.error as ErrorOf<Fields[keyof Fields]>);
    values[key] = result.value;
  }

  return ok(values as { [K in keyof Fields]: ValueOf<Fields[K]> });
};

export const unwrapOrThrow = <T, E>(
  result: Result<T, E>,
  message: string,
): T => {
  if (!result.ok) {
    throw new Error(message);
  }
  return result.value;
};
