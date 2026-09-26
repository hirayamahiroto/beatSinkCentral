import { describe, it, expect } from "vitest";
import { createErrorChannel } from "./index";
import { createTypedError } from "../createTypedError";

type SampleError = Error & { readonly type: "SampleError" };

const createSampleError = (): SampleError => createTypedError("SampleError");

describe("createErrorChannel", () => {
  it("raise は渡したエラーをそのまま throw する", () => {
    const channel = createErrorChannel<SampleError>();
    const error = createSampleError();

    expect(() => channel.raise(error)).toThrow(error);
  });

  it("raise したエラーを recover で同じインスタンスとして取り出せる", () => {
    const channel = createErrorChannel<SampleError>();
    const error = createSampleError();
    const thrown: unknown = (() => {
      try {
        channel.raise(error);
      } catch (caught) {
        return caught;
      }
    })();

    const recovered = channel.recover(thrown);

    expect(recovered).toBe(error);
    expect(recovered?.type).toBe("SampleError");
  });

  it("raise を経ていないエラーは同じ type でも recover しない", () => {
    const channel = createErrorChannel<SampleError>();

    expect(channel.recover(createSampleError())).toBeNull();
    expect(channel.recover(new Error("boom"))).toBeNull();
  });

  it("Error 以外の値は recover しない", () => {
    const channel = createErrorChannel<SampleError>();

    expect(channel.recover({ type: "SampleError" })).toBeNull();
    expect(channel.recover(null)).toBeNull();
    expect(channel.recover(undefined)).toBeNull();
  });

  it("別のチャネルで raise したエラーは recover しない", () => {
    const own = createErrorChannel<SampleError>();
    const other = createErrorChannel<SampleError>();
    const error = createSampleError();

    expect(() => other.raise(error)).toThrow(error);
    expect(own.recover(error)).toBeNull();
    expect(other.recover(error)).toBe(error);
  });
});
