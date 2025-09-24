import { describe, it, expect } from "vitest";
import { createHumanBeatboxerProfile } from "./index";

describe("createHumanBeatboxerProfile", () => {
  it("必要な全てのフィールドを持つHumanBeatboxerProfileを作成できる", () => {
    const id = "test-id-123";
    const artistName = "テストアーティスト";
    const age = 25;
    const sex = "male";

    const profile = createHumanBeatboxerProfile(id, artistName, age, sex);

    expect(profile.id).toBe(id);
    expect(profile.artistName).toBe(artistName);
    expect(profile.age).toBe(age);
    expect(profile.sex).toBe(sex);
    expect(profile.createdAt).toBeInstanceOf(Date);
    expect(profile.updatedAt).toBeInstanceOf(Date);
  });
});
