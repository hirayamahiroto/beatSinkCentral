import { describe, it, expect } from "vitest";
import { withIdentityCapabilities } from "./index";
import {
  createCapabilityDepsStub,
  testUser as user,
  testArtist as artist,
} from "../testDoubles";

describe("withIdentityCapabilities", () => {
  it("Actor が解決できなくても解決状態をそのまま渡す", async () => {
    const { deps, calls } = createCapabilityDepsStub({
      status: "unregistered",
    });

    const received = await withIdentityCapabilities(
      deps,
      "auth0|unknown",
      async (caps) => caps.actorResolution,
    );

    expect(received).toStrictEqual({ status: "unregistered" });
    expect(calls.resolvedSubIds).toEqual(["auth0|unknown"]);
  });

  it("Artist が未作成でも userOnly をそのまま渡す", async () => {
    const { deps } = createCapabilityDepsStub({ status: "userOnly", user });

    const received = await withIdentityCapabilities(
      deps,
      "auth0|123",
      async (caps) => caps.actorResolution,
    );

    expect(received).toStrictEqual({ status: "userOnly", user });
  });

  it("Actor が揃っていれば complete をそのまま渡す", async () => {
    const { deps } = createCapabilityDepsStub({
      status: "complete",
      actor: { user, artist },
    });

    const received = await withIdentityCapabilities(
      deps,
      "auth0|123",
      async (caps) => caps.actorResolution,
    );

    expect(received).toStrictEqual({
      status: "complete",
      actor: { user, artist },
    });
  });
});
