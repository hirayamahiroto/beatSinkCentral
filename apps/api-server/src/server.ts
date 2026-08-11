import { serve } from "@hono/node-server";
import app from "./index";

const DEFAULT_PORT = 3001;

const resolvePort = (value: string | undefined): number => {
  if (value === undefined) return DEFAULT_PORT;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`PORT must be a positive integer: ${value}`);
  }
  return parsed;
};

const port = resolvePort(process.env.PORT);

serve({ fetch: app.fetch, port }, ({ port: boundPort }) => {
  console.info(`api-server listening on http://localhost:${boundPort}`);
});
