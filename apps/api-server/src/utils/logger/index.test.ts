import { describe, it, expect, vi, afterEach } from "vitest";
import { createConsoleLogger } from "./index";

describe("createConsoleLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("info を level 付きの 1 行 JSON として console.info へ出す", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    createConsoleLogger().info("SomeEvent", { errorType: "SomeError" });

    expect(infoSpy).toHaveBeenCalledWith(
      JSON.stringify({
        level: "info",
        event: "SomeEvent",
        errorType: "SomeError",
      }),
    );
  });

  it("warn を level 付きの 1 行 JSON として console.warn へ出す", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    createConsoleLogger().warn("SomeEvent", { errorType: "SomeError" });

    expect(warnSpy).toHaveBeenCalledWith(
      JSON.stringify({
        level: "warn",
        event: "SomeEvent",
        errorType: "SomeError",
      }),
    );
  });

  it("error を level 付きの 1 行 JSON として console.error へ出す", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    createConsoleLogger().error("SomeEvent", { errorType: "SomeError" });

    expect(errorSpy).toHaveBeenCalledWith(
      JSON.stringify({
        level: "error",
        event: "SomeEvent",
        errorType: "SomeError",
      }),
    );
  });

  it("ネストしたフィールドも 1 行 JSON に収める", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    createConsoleLogger().error("AppError", {
      requestId: "req-1",
      context: { missingFields: ["story"] },
    });

    expect(errorSpy).toHaveBeenCalledWith(
      '{"level":"error","event":"AppError","requestId":"req-1","context":{"missingFields":["story"]}}',
    );
  });
});
