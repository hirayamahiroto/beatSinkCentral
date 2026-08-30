type ErrorWithType<TypeName extends string> = Error & {
  readonly type: TypeName;
};

type CreateTypedError = {
  <TypeName extends string>(type: TypeName): ErrorWithType<TypeName>;
  <TypeName extends string, Extras extends object>(
    type: TypeName,
    extras: Extras,
  ): ErrorWithType<TypeName> & Extras;
};

export const createTypedError: CreateTypedError = <TypeName extends string>(
  type: TypeName,
  extras?: object,
): ErrorWithType<TypeName> => {
  const typeField: { readonly type: TypeName } = { type };
  const base = Object.assign(new Error(type), typeField);
  if (extras !== undefined) {
    return Object.assign(base, extras);
  }
  return base;
};
