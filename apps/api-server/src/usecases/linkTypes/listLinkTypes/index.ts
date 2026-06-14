import type { ILinkTypeRepository } from "../../../domain/linkTypes/repositories";
import type { LinkTypeView } from "../../../domain/linkTypes/entities";

export type ListLinkTypesOutput = {
  linkTypes: LinkTypeView[];
};

export type ListLinkTypesDeps = {
  linkTypeRepository: ILinkTypeRepository;
};

export const listLinkTypesUseCase = async (
  deps: ListLinkTypesDeps,
): Promise<ListLinkTypesOutput> => {
  const linkTypes = await deps.linkTypeRepository.findAll();
  return { linkTypes };
};
