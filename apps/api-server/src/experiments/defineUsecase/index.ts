type NoExtraKeys<T, Deps> = Record<Exclude<keyof T, keyof Deps>, never>;

export const defineUsecase =
  <Deps, Input, Output>(
    impl: (deps: Deps) => (input: Input) => Promise<Output>,
  ) =>
  <T extends Deps>(deps: T & NoExtraKeys<T, Deps>) =>
    impl(deps);
