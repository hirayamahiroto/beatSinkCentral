import type { PresentationPatternView } from "../entities";

export interface IPresentationPatternReader {
  findAll(): Promise<PresentationPatternView[]>;
}
