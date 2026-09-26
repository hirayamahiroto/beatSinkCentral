export type ErrorChannel<E extends Error> = {
  readonly raise: (error: E) => never;
  readonly recover: (thrown: unknown) => E | null;
};

export const createErrorChannel = <E extends Error>(): ErrorChannel<E> => {
  const raised = new WeakMap<Error, E>();

  return {
    raise: (error) => {
      raised.set(error, error);
      throw error;
    },
    recover: (thrown) => {
      if (!(thrown instanceof Error)) return null;
      const error = raised.get(thrown);
      return error === undefined ? null : error;
    },
  };
};
