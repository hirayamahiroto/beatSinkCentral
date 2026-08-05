import { describe, it, expect, vi, afterEach } from "vitest";
import { createConsoleLogger } from "./index";

describe("createConsoleLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("info を console.info へ event と fields のまま委譲する", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    createConsoleLogger().info("SomeEvent", { errorType: "SomeError" });

    expect(infoSpy).toHaveBeenCalledWith("SomeEvent", {
      errorType: "SomeError",
    });
  });

  it("warn を console.warn へ event と fields のまま委譲する", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    createConsoleLogger().warn("SomeEvent", { errorType: "SomeError" });

    expect(warnSpy).toHaveBeenCalledWith("SomeEvent", {
      errorType: "SomeError",
    });
  });

  it("error を console.error へ event と fields のまま委譲する", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    createConsoleLogger().error("SomeEvent", { errorType: "SomeError" });

    expect(errorSpy).toHaveBeenCalledWith("SomeEvent", {
      errorType: "SomeError",
    });
  });
});
