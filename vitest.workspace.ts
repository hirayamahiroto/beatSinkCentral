import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "apps/*/vitest.config.{ts,mts}",
  "packages/*/vitest.config.{ts,mts}",
  {
    test: {
      include: ["packages/**/src/**/*.{test,spec}.{ts,tsx}"],
      name: "packages",
    },
  },
  {
    test: {
      include: ["apps/**/src/**/*.{test,spec}.{ts,tsx}"],
      name: "apps",
    },
  },
]);