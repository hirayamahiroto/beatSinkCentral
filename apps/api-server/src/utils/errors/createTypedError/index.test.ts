import { describe, it, expect } from "vitest";
import { createTypedError } from "./index";

describe("createTypedError", () => {
  describe("extras なし", () => {
    it("type を持つ Error を返す（message は type と同値）", () => {
      const error = createTypedError("SampleError");

      expect(error).toBeInstanceOf(Error);
      expect(error.type).toBe("SampleError");
      expect(error.message).toBe("SampleError");
    });

    it("throw して catch しても type を保持する", () => {
      try {
        throw createTypedError("SampleError");
      } catch (caught) {
        if (caught instanceof Error) {
          expect((caught as { type?: unknown }).type).toBe("SampleError");
        } else {
          throw new Error("caught is not an Error instance");
        }
      }
    });
  });

  describe("extras あり", () => {
    it("extras のフィールドが型付きで Error に付与される", () => {
      const error = createTypedError("SampleWithContextError", {
        userId: "user_1",
        count: 5,
      });

      expect(error.type).toBe("SampleWithContextError");
      expect(error.userId).toBe("user_1");
      expect(error.count).toBe(5);
    });

    it("extras が空オブジェクトでもエラーは成立する", () => {
      const error = createTypedError("SampleError", {});

      expect(error.type).toBe("SampleError");
      expect(error.message).toBe("SampleError");
    });
  });
});
