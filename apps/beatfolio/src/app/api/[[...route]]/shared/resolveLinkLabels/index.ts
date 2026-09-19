type ProfileLink = {
  linkTypeCode: string;
  url: string;
};

type LinkType = {
  type: string;
  label: string;
};

export type ResolvedLink = {
  type: string;
  url: string;
  label: string;
};

export const resolveLinkLabels = (
  links: ProfileLink[],
  linkTypes: LinkType[],
): ResolvedLink[] => {
  const labelByType = new Map(
    linkTypes.map((linkType) => [linkType.type, linkType.label]),
  );

  return links.map((link) => {
    const label = labelByType.get(link.linkTypeCode);

    if (label === undefined) {
      throw new Error(`Unknown link type: ${link.linkTypeCode}`);
    }

    return { type: link.linkTypeCode, url: link.url, label };
  });
};
