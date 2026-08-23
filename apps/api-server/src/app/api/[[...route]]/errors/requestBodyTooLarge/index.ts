import { createTypedError } from "../../../../../utils/errors/createTypedError";

export type RequestBodyTooLargeError = Error & {
  readonly type: "RequestBodyTooLargeError";
};

export const createRequestBodyTooLargeError = (): RequestBodyTooLargeError =>
  createTypedError("RequestBodyTooLargeError");
