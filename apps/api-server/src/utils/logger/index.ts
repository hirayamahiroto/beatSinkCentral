export type LogLevel = "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

export type Logger = {
  [Level in LogLevel]: (event: string, fields: LogFields) => void;
};

export const createConsoleLogger = (): Logger => ({
  info: (event, fields) => console.info(event, fields),
  warn: (event, fields) => console.warn(event, fields),
  error: (event, fields) => console.error(event, fields),
});
