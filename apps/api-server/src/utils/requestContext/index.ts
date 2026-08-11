import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  requestId: string;
  traceId?: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

export const runWithRequestContext = <Result>(
  context: RequestContext,
  run: () => Result,
): Result => storage.run(context, run);

export const getRequestContext = (): RequestContext | undefined =>
  storage.getStore();
