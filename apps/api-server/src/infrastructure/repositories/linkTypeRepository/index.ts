import { asc } from "drizzle-orm";
import {
  DatabaseClient,
  linkTypesTable,
} from "../../../../../../packages/database/src/utils/createClient";
import type { ILinkTypeRepository } from "../../../domain/linkTypes/repositories";
import type { LinkTypeView } from "../../../domain/linkTypes/entities";

export const createLinkTypeRepository = (
  db: DatabaseClient,
): ILinkTypeRepository => ({
  async findAll(): Promise<LinkTypeView[]> {
    return db
      .select({ type: linkTypesTable.code, label: linkTypesTable.label })
      .from(linkTypesTable)
      .orderBy(asc(linkTypesTable.id));
  },
});
