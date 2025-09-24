import { describe, it, expect, beforeEach } from "vitest";
import { createHumanBeatboxer } from "./index";
import type { HumanBeatboxerProfile } from "../types";

describe("createHumanBeatboxer", () => {
  let testProfile: HumanBeatboxerProfile;

  beforeEach(() => {
    testProfile = {
      id: "profile-001",
      artistName: "テストアーティスト",
      age: 25,
      sex: "男性",
      createdAt: new Date("2024-01-01T10:00:00Z"),
      updatedAt: new Date("2024-01-01T10:00:00Z"),
    };
  });

  it("必要な全てのフィールドを持つHumanBeatboxerを作成できる", () => {
    const id = "hbb-001";
    const userId = "user-001";
    const profileId = "profile-001";

    const humanBeatboxer = createHumanBeatboxer(
      id,
      userId,
      profileId,
      testProfile
    );

    expect(humanBeatboxer.id).toBe(id);
    expect(humanBeatboxer.userId).toBe(userId);
    expect(humanBeatboxer.profileId).toBe(profileId);
    expect(humanBeatboxer.profile).toEqual(testProfile);
    expect(humanBeatboxer.createdAt).toBeInstanceOf(Date);
  });
});
