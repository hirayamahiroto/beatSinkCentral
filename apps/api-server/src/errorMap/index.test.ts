import { describe, it, expect, vi, afterEach } from "vitest";
import { Hono } from "hono";
import { handleAppError } from "./index";
import { createUserAlreadyRegisteredError } from "../domain/users/errors/userAlreadyRegistered";

describe("handleAppError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const requestWithDefaultHandler = async (error: unknown) =>
    new Hono()
      .get("/", () => {
        throw error;
      })
      .onError(handleAppError)
      .request("/");

  it("既定の logger として console を使い logLevel に対応するメソッドへ出力する", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await requestWithDefaultHandler(createUserAlreadyRegisteredError());

    expect(infoSpy).toHaveBeenCalledWith(
      JSON.stringify({
        level: "info",
        event: "AppError",
        method: "GET",
        route: "/",
        errorType: "UserAlreadyRegisteredError",
        status: 409,
      }),
    );
  });

  it("未知のエラーは console.error へ出力する", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const rawError = new Error("boom");

    await requestWithDefaultHandler(rawError);

    expect(errorSpy).toHaveBeenCalledWith(
      JSON.stringify({
        level: "error",
        event: "UnhandledError",
        method: "GET",
        route: "/",
        errorName: "Error",
        message: "boom",
        stack: rawError.stack,
      }),
    );
  });
});
