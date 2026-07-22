type ProfileLink = {
  type: string;
  url: string;
  label: string | null;
};

type LinkType = {
  type: string;
  label: string;
};

export type ResolvedLink = {
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
    const label = link.label ?? labelByType.get(link.type);

    if (label === undefined) {
      throw new Error(`Unknown link type: ${link.type}`);
    }

    return { url: link.url, label };
  });
};
