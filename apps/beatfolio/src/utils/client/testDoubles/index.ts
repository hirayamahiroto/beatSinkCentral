import { vi, type Mock } from "vitest";
import type { ClientResponse, InferResponseType } from "hono/client";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { createApiServerClient } from "../index";

export type ApiServerClient = ReturnType<typeof createApiServerClient>;

type AnyEndpoint = (...args: never[]) => Promise<unknown>;

type UpstreamResponseStub<Body, Status extends number> = {
  ok: boolean;
  status: Status;
  json: () => Promise<Body>;
};

type UpstreamNoContentStub = {
  ok: true;
  status: 204;
  json: () => Promise<undefined>;
};

type UpstreamContractViolationStub = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  violatesContract: true;
};

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [K in keyof T]: Mutable<T[K]> }
    : T;

export type UpstreamSuccessBody<E extends AnyEndpoint> = InferResponseType<
  E,
  200
>;

type ImplicitOkStatus<Status extends number> =
  ContentfulStatusCode extends Status ? 200 : Status;

type UpstreamJsonStub<E extends AnyEndpoint> =
  Awaited<ReturnType<E>> extends infer Response
    ? Response extends ClientResponse<
        infer Body,
        infer Status extends number,
        "json"
      >
      ? UpstreamResponseStub<Body, ImplicitOkStatus<Status>>
      : never
    : never;

type UpstreamNoContentStubOf<E extends AnyEndpoint> = [
  InferResponseType<E, 204>,
] extends [never]
  ? never
  : UpstreamNoContentStub;

type EndpointMock<E extends AnyEndpoint> = Mock<
  (
    ...args: Parameters<E>
  ) => Promise<
    | UpstreamJsonStub<E>
    | UpstreamNoContentStubOf<E>
    | UpstreamContractViolationStub
  >
>;

export type ApiServerClientMock<T = ApiServerClient> = T extends AnyEndpoint
  ? EndpointMock<T>
  : { readonly [K in keyof T]?: ApiServerClientMock<T[K]> };

export const createEndpointMock = <E extends AnyEndpoint>(): EndpointMock<E> =>
  vi.fn();

const isSuccessStatus = (status: number) => status >= 200 && status < 300;

export function upstreamJsonResponse<const Body>(
  body: Body,
): UpstreamResponseStub<Mutable<Body>, 200>;
export function upstreamJsonResponse<const Body, Status extends number>(
  body: Body,
  status: Status,
): UpstreamResponseStub<Mutable<Body>, Status>;
export function upstreamJsonResponse(
  body: unknown,
  status = 200,
): UpstreamResponseStub<unknown, number> {
  return {
    ok: isSuccessStatus(status),
    status,
    json: async () => body,
  };
}

export const upstreamNoContentResponse = (): UpstreamNoContentStub => ({
  ok: true,
  status: 204,
  json: async () => undefined,
});

export const upstreamContractViolationResponse = (
  body: unknown,
  status: number,
): UpstreamContractViolationStub => ({
  ok: isSuccessStatus(status),
  status,
  json: async () => body,
  violatesContract: true,
});

export const upstreamMalformedJsonResponse = (
  status = 200,
): UpstreamContractViolationStub => ({
  ok: isSuccessStatus(status),
  status,
  json: async () => {
    throw new SyntaxError("Unexpected end of JSON input");
  },
  violatesContract: true,
});
