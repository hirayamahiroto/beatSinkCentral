import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "apps/*/vitest.config.{ts,mts}",
  "packages/*/vitest.config.{ts,mts}",
]);