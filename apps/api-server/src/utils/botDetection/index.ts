const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|headlesschrome|phantomjs|puppeteer|playwright/i;

export const isBotUserAgent = (
  userAgent: string | undefined | null,
): boolean => {
  if (!userAgent) return false;
  return BOT_USER_AGENT_PATTERN.test(userAgent);
};
