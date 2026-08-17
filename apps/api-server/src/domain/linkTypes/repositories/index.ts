import type { LinkTypeView } from "../entities";

export interface ILinkTypeReader {
  findAll(): Promise<LinkTypeView[]>;
}
