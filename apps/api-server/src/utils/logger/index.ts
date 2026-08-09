export type LogLevel = "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

export type Logger = {
  [Level in LogLevel]: (event: string, fields: LogFields) => void;
};

const serialize = (level: LogLevel, event: string, fields: LogFields): string =>
  JSON.stringify({ level, event, ...fields });

export const createConsoleLogger = (): Logger => ({
  info: (event, fields) => console.info(serialize("info", event, fields)),
  warn: (event, fields) => console.warn(serialize("warn", event, fields)),
  error: (event, fields) => console.error(serialize("error", event, fields)),
});
