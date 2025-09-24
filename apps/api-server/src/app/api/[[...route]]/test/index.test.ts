import { describe, it, expect } from "vitest";
import app from "./index";

describe("Test API endpoint", () => {
  it("should return Hello World message", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({ message: "Hello World" });
  });

  it("should return JSON content type", async () => {
    const res = await app.request("/");
    expect(res.headers.get("content-type")).toContain("application/json");
  });
});