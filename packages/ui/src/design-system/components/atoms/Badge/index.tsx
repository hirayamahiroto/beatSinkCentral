import { Badge as PrimitiveBadge } from "@ui/design-system/primitives/badge";

// primitive を薄く re-export するのみ（バリアントは primitive の props として公開）
export const Badge = PrimitiveBadge;
export type { BadgeProps } from "@ui/design-system/primitives/badge";
