import { describe, it, expect } from "vitest";
import { createUserId, generateUserId, userIdToJson } from "./index";

describe("UserId", () => {
  describe("createUserId", () => {
    it("有効なUserIdフォーマットでUserIdオブジェクトを作成できる", () => {
      const validUserIds = [
        "user_1234567890_abcdefghi",
        "user_9876543210_xyz123456",
        "user_1000000000_test12345",
      ];

      validUserIds.forEach((userId) => {
        const userIdObj = createUserId(userId);
        expect(userIdObj.value).toBe(userId);
      });
    });

    it("無効なUserIdフォーマットではエラーをスローする", () => {
      const invalidUserIds = [
        "invalid-format",
        "user_123_abc", // タイムスタンプが短すぎる
        "user_1234567890_ABC", // 大文字を含む
        "user_1234567890_ab", // ランダム文字列が短すぎる
        "user_1234567890_abcdefghij", // ランダム文字列が長すぎる
        "usr_1234567890_abcdefghi", // プレフィックスが間違い
        "user_abc_defghijkl", // タイムスタンプが数値でない
        "",
        "user_1234567890_", // ランダム文字列がない
      ];

      invalidUserIds.forEach((userId) => {
        expect(() => createUserId(userId)).toThrow("Invalid UserId format");
      });
    });

    it("長すぎるUserIdは拒否される", () => {
      const tooLongUserId = "user_1234567890_" + "a".repeat(50);
      expect(() => createUserId(tooLongUserId)).toThrow("Invalid UserId format");
    });

    it("短すぎるUserIdは拒否される", () => {
      const tooShortUserId = "user_123_ab";
      expect(() => createUserId(tooShortUserId)).toThrow("Invalid UserId format");
    });
  });

  describe("generateUserId", () => {
    it("有効なフォーマットのUserIdを生成できる", () => {
      const userId = generateUserId();

      expect(userId.value).toMatch(/^user_\d+_[a-z0-9]{9}$/);
      expect(userId.value.length).toBeGreaterThanOrEqual(20);
      expect(userId.value.length).toBeLessThanOrEqual(50);
    });

    it("複数回生成しても異なるUserIdが生成される", () => {
      const userId1 = generateUserId();
      const userId2 = generateUserId();

      expect(userId1.value).not.toBe(userId2.value);
    });

    it("生成されたUserIdがcreateUserId関数で検証できる", () => {
      const generatedUserId = generateUserId();

      expect(() => createUserId(generatedUserId.value)).not.toThrow();
    });

    it("タイムスタンプが現在時刻に近い", () => {
      const before = Date.now();
      const userId = generateUserId();
      const after = Date.now();

      const timestampMatch = userId.value.match(/^user_(\d+)_/);
      expect(timestampMatch).not.toBeNull();

      const timestamp = parseInt(timestampMatch![1]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("userIdToJson", () => {
    it("UserIdオブジェクトをJSON文字列に変換できる", () => {
      const userId = createUserId("user_1234567890_abcdefghi");
      const json = userIdToJson(userId);

      expect(json).toBe("user_1234567890_abcdefghi");
      expect(typeof json).toBe("string");
    });

    it("生成されたUserIdも正しくJSON変換される", () => {
      const userId = generateUserId();
      const json = userIdToJson(userId);

      expect(json).toBe(userId.value);
      expect(typeof json).toBe("string");
    });
  });
});