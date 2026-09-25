import { vi, type Mock } from "vitest";
import type { InferResponseType } from "hono/client";
import type { createApiServerClient, createBeatfolioBffClient } from "../index";

export type ApiServerClient = ReturnType<typeof createApiServerClient>;
export type BeatfolioBffClient = ReturnType<typeof createBeatfolioBffClient>;

type AnyEndpoint = (...args: never[]) => Promise<unknown>;

type UpstreamResponseStub<T> = {
  ok: boolean;
  status: number;
  json: () => Promise<T>;
};

type UpstreamNoContentStub = {
  ok: true;
  status: 204;
  json: () => Promise<never>;
};

type UpstreamErrorBody = { error?: string };

export type UpstreamSuccessBody<E extends AnyEndpoint> = InferResponseType<
  E,
  200
>;

type EndpointMock<E extends AnyEndpoint> = Mock<
  (
    ...args: Parameters<E>
  ) => Promise<
    UpstreamResponseStub<InferResponseType<E>> | UpstreamNoContentStub
  >
>;

export type ApiServerClientMock<T = ApiServerClient> = T extends AnyEndpoint
  ? EndpointMock<T>
  : { readonly [K in keyof T]?: ApiServerClientMock<T[K]> };

export type BeatfolioBffClientMock = ApiServerClientMock<BeatfolioBffClient>;

export const createEndpointMock = <E extends AnyEndpoint>(): EndpointMock<E> =>
  vi.fn();

export const upstreamJsonResponse = <T>(
  body: T,
  status = 200,
): UpstreamResponseStub<T> => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

export const upstreamNoContentResponse = (): UpstreamNoContentStub => ({
  ok: true,
  status: 204,
  json: async () => {
    throw new SyntaxError("Unexpected end of JSON input");
  },
});

export const upstreamErrorResponse = <T, B extends UpstreamErrorBody>(
  body: B,
  status: number,
): UpstreamResponseStub<T> => ({
  ok: false,
  status,
  json: async () => JSON.parse(JSON.stringify(body)),
});

export const upstreamMalformedJsonResponse = (
  status = 200,
): UpstreamResponseStub<never> => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => {
    throw new SyntaxError("Unexpected end of JSON input");
  },
});
