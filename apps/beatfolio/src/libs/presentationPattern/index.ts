import type { ImmersivePatternCode } from "@ui/design-system/components/organisms/ArtistImmersiveProfile";

export const DEFAULT_PRESENTATION_PATTERN: ImmersivePatternCode = "interview";

const IMPLEMENTED_PATTERNS: Record<ImmersivePatternCode, ImmersivePatternCode> =
  {
    interview: "interview",
    zoom_dive: "zoom_dive",
    spotlight: "spotlight",
    editorial: "editorial",
  };

const PATTERN_BY_CODE = new Map<string, ImmersivePatternCode>(
  Object.values(IMPLEMENTED_PATTERNS).map((code) => [code, code]),
);

export const toImmersivePatternCode = (
  code: string,
): ImmersivePatternCode | undefined => PATTERN_BY_CODE.get(code);
