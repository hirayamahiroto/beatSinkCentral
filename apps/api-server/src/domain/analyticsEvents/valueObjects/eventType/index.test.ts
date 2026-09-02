import { describe, it, expect } from "vitest";
import { ANALYTICS_EVENT_TYPES, createEventType } from "./index";

describe("createEventType", () => {
  it.each(ANALYTICS_EVENT_TYPES)(
    "既知の種別 %s でEventTypeを生成する",
    (type) => {
      const result = createEventType(type);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe(type);
      }
    },
  );

  it("未知の種別は err を返す", () => {
    expect(createEventType("unknown_event").ok).toBe(false);
  });

  it("空文字は err を返す", () => {
    expect(createEventType("").ok).toBe(false);
  });

  it("返るエラーは InvalidEventTypeFormatError 型", () => {
    const result = createEventType("unknown_event");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidEventTypeFormatError");
    }
  });
});
