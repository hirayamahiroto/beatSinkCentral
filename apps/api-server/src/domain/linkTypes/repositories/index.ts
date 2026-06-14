import type { LinkTypeView } from "../entities";

export interface ILinkTypeRepository {
  findAll(): Promise<LinkTypeView[]>;
}
