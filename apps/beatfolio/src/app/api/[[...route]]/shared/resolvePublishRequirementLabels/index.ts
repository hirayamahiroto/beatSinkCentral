const PUBLISH_REQUIREMENT_LABELS = new Map<string, string>([
  ["name", "活動名"],
  ["imageUrl", "アーティスト写真"],
  ["story", "Story"],
  ["genres", "ジャンル"],
  ["links", "SNS / 配信リンク"],
]);

export const resolvePublishRequirementLabels = (
  missingFields: string[],
): string[] =>
  missingFields.flatMap((field) => {
    const label = PUBLISH_REQUIREMENT_LABELS.get(field);
    return label === undefined ? [] : [label];
  });
