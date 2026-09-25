import { vi } from "vitest";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type RouterSurface = Pick<AppRouterInstance, "push" | "refresh">;

export type RouterModule = { useRouter: () => RouterSurface };

export const createRouterMock = () =>
  ({
    push: vi.fn<AppRouterInstance["push"]>(),
    refresh: vi.fn<AppRouterInstance["refresh"]>(),
  }) satisfies RouterSurface;
