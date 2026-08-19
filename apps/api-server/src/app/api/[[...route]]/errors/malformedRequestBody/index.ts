import { createTypedError } from "../../../../../utils/errors/createTypedError";

export type MalformedRequestBodyError = Error & {
  readonly type: "MalformedRequestBodyError";
};

export const createMalformedRequestBodyError = (): MalformedRequestBodyError =>
  createTypedError("MalformedRequestBodyError");
