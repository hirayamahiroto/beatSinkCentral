import { asc } from "drizzle-orm";
import { presentationPatternsTable } from "../../../../../../packages/database/src/utils/createClient";
import type { IPresentationPatternReader } from "../../../domain/presentationPatterns/repositories";
import type { PresentationPatternView } from "../../../domain/presentationPatterns/entities";
import type { Executor } from "../../transaction";

export const createPresentationPatternReader = (
  executor: Executor,
): IPresentationPatternReader => ({
  async findAll(): Promise<PresentationPatternView[]> {
    return executor
      .select({
        code: presentationPatternsTable.code,
        label: presentationPatternsTable.label,
      })
      .from(presentationPatternsTable)
      .orderBy(asc(presentationPatternsTable.id));
  },
});
