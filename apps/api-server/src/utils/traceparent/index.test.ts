import { describe, it, expect } from "vitest";
import { parseTraceId } from "./index";

const TRACE_ID = "4bf92f3577b34da6a3ce929d0e0e4736";
const SPAN_ID = "00f067aa0ba902b7";

describe("parseTraceId", () => {
  it("W3C traceparent から trace-id を取り出す", () => {
    expect(parseTraceId(`00-${TRACE_ID}-${SPAN_ID}-01`)).toBe(TRACE_ID);
  });

  it("ヘッダが無い場合は undefined を返す", () => {
    expect(parseTraceId(undefined)).toBeUndefined();
  });

  it("形式が不正な場合は undefined を返す", () => {
    expect(parseTraceId("not-a-traceparent")).toBeUndefined();
    expect(parseTraceId(`00-${TRACE_ID}-${SPAN_ID}`)).toBeUndefined();
    expect(parseTraceId(`00-tooshort-${SPAN_ID}-01`)).toBeUndefined();
  });

  it("大文字は W3C 仕様外なので undefined を返す", () => {
    expect(
      parseTraceId(`00-${TRACE_ID.toUpperCase()}-${SPAN_ID}-01`),
    ).toBeUndefined();
  });

  it("全て 0 の trace-id は無効なので undefined を返す", () => {
    expect(parseTraceId(`00-${"0".repeat(32)}-${SPAN_ID}-01`)).toBeUndefined();
  });

  it("バージョン ff は W3C 仕様上無効なので undefined を返す", () => {
    expect(parseTraceId(`ff-${TRACE_ID}-${SPAN_ID}-01`)).toBeUndefined();
  });

  it("全て 0 の parent-id は無効なので undefined を返す", () => {
    expect(parseTraceId(`00-${TRACE_ID}-${"0".repeat(16)}-01`)).toBeUndefined();
  });
});
