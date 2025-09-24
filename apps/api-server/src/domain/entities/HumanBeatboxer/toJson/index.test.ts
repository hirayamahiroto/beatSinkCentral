import { describe, it, expect } from "vitest";
import { humanBeatboxerToJson } from "./index";
import { createHumanBeatboxer } from "../create";
import { HumanBeatboxerProfile } from "../types";

describe("humanBeatboxerToJson", () => {
  it("HumanBeatboxerをJSON形式に変換できる", () => {
    const profile: HumanBeatboxerProfile = {
      id: "profile-001",
      artistName: "テストアーティスト",
      age: 25,
      sex: "男性",
      createdAt: new Date("2024-01-01T10:00:00Z"),
      updatedAt: new Date("2024-01-02T12:00:00Z"),
    };

    const humanBeatboxer = createHumanBeatboxer(
      "hbb-001",
      "user-001",
      "profile-001",
      profile
    );

    const json = humanBeatboxerToJson(humanBeatboxer);

    expect(json.id).toBe("hbb-001");
    expect(json.userId).toBe("user-001");
    expect(json.profileId).toBe("profile-001");
    expect(typeof json.createdAt).toBe("string");
  });
});
