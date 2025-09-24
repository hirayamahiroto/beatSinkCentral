import { describe, it, expect, beforeEach } from "vitest";
import { humanBeatboxerProfileToJson } from "./index";
import { createHumanBeatboxerProfile } from "../create";
import { HumanBeatboxerProfile } from "../../types";

describe("humanBeatboxerProfileToJson", () => {
  let profile: HumanBeatboxerProfile;

  beforeEach(() => {
    profile = createHumanBeatboxerProfile(
      "json-test-id",
      "JSONテストアーティスト",
      30,
      "ノンバイナリー"
    );
  });

  it("プロファイルをJSON形式に変換できる", () => {
    const json = humanBeatboxerProfileToJson(profile);

    expect(json.id).toBe(profile.id);
    expect(json.artistName).toBe(profile.artistName);
    expect(json.age).toBe(profile.age);
    expect(json.sex).toBe(profile.sex);
    expect(typeof json.createdAt).toBe("string");
    expect(typeof json.updatedAt).toBe("string");
  });
});
