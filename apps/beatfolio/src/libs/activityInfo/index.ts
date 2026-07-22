import type { WizardValues } from "@ui/design-system/components/organisms/ArtistProfileWizard";

type ActivityForm = WizardValues["activityForm"];

export type ActivityFields = {
  location?: string;
  activityForm: ActivityForm;
  affiliation?: string;
};

const FORM_LABEL: Record<ActivityForm, string> = {
  solo: "ソロ",
  unit: "ユニット",
  crew: "バンド / クルー",
};

const LABEL_TO_FORM: Record<string, ActivityForm> = {
  ソロ: "solo",
  ユニット: "unit",
  "バンド / クルー": "crew",
};

const SEPARATOR = " / ";
const LOCATION_PREFIX = "拠点: ";
const FORM_PREFIX = "形態: ";
const AFFILIATION_PREFIX = "所属: ";
const FORM_SEP = `${SEPARATOR}${FORM_PREFIX}`;
const AFFILIATION_SEP = `${SEPARATOR}${AFFILIATION_PREFIX}`;

export const composeActivityInfo = (fields: ActivityFields): string =>
  [
    fields.location?.trim()
      ? `${LOCATION_PREFIX}${fields.location.trim()}`
      : null,
    `${FORM_PREFIX}${FORM_LABEL[fields.activityForm]}`,
    fields.affiliation?.trim()
      ? `${AFFILIATION_PREFIX}${fields.affiliation.trim()}`
      : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(SEPARATOR);

export const parseActivityInfo = (
  activityInfo: string | null,
): Partial<ActivityFields> => {
  const result: Partial<ActivityFields> = {};
  if (!activityInfo) return result;

  let head = activityInfo;

  const affiliationIdx = head.indexOf(AFFILIATION_SEP);
  if (affiliationIdx >= 0) {
    const affiliation = head
      .slice(affiliationIdx + AFFILIATION_SEP.length)
      .trim();
    if (affiliation) result.affiliation = affiliation;
    head = head.slice(0, affiliationIdx);
  }

  let formSegment: string;
  const formSepIdx = head.indexOf(FORM_SEP);
  if (head.startsWith(LOCATION_PREFIX) && formSepIdx >= 0) {
    const location = head.slice(LOCATION_PREFIX.length, formSepIdx).trim();
    if (location) result.location = location;
    formSegment = head.slice(formSepIdx + FORM_SEP.length);
  } else if (head.startsWith(FORM_PREFIX)) {
    formSegment = head.slice(FORM_PREFIX.length);
  } else {
    return result;
  }

  const form = LABEL_TO_FORM[formSegment.trim()];
  if (form) result.activityForm = form;

  return result;
};
