import { describe, it, expect } from "vitest";
import { isBotUserAgent } from "./index";

describe("isBotUserAgent", () => {
  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "facebookexternalhit/1.1",
    "Slackbot-LinkExpanding 1.0",
    "Mozilla/5.0 (compatible; HeadlessChrome/120.0.0.0)",
    "python-requests/2.31.0 Spider",
  ])("既知のbot/crawlerパターン %s はbotと判定する", (userAgent) => {
    expect(isBotUserAgent(userAgent)).toBe(true);
  });

  it.each([
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    "curl/8.4.0",
  ])("通常のUAやHTTPクライアント %s はbotと判定しない", (userAgent) => {
    expect(isBotUserAgent(userAgent)).toBe(false);
  });

  it("UAが空/未指定はbotと判定しない（防御は既知パターンの一致のみ）", () => {
    expect(isBotUserAgent(undefined)).toBe(false);
    expect(isBotUserAgent(null)).toBe(false);
    expect(isBotUserAgent("")).toBe(false);
  });
});
