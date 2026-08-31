import { describe, it, expect } from "vitest";
import { createInsecureBffBaseUrlError } from "./index";

describe("insecureBffBaseUrl", () => {
  it("type を持つ Error を生成する", () => {
    const error = createInsecureBffBaseUrlError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("InsecureBffBaseUrlError");
  });
});
