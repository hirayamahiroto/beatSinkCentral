import { asc } from "drizzle-orm";
import {
  DatabaseClient,
  linkTypesTable,
} from "../../../../../../packages/database/src/utils/createClient";
import type { ILinkTypeReader } from "../../../domain/linkTypes/repositories";
import type { LinkTypeView } from "../../../domain/linkTypes/entities";
import type { TransactionContext } from "../../transaction";

type Executor = DatabaseClient | TransactionContext;

export const createLinkTypeReader = (executor: Executor): ILinkTypeReader => ({
  async findAll(): Promise<LinkTypeView[]> {
    return executor
      .select({ type: linkTypesTable.code, label: linkTypesTable.label })
      .from(linkTypesTable)
      .orderBy(asc(linkTypesTable.id));
  },
});
