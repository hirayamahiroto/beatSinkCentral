import { z } from "zod";
import type { UpstreamErrorBody } from "../../app/api/[[...route]]/errors/upstreamRejected";
import { resolvePublishRequirementLabels } from "../../app/api/[[...route]]/shared/resolvePublishRequirementLabels";

const notPublishableDetailsSchema = z.object({
  missingFields: z.array(z.string()),
});

const coPerformerNotFoundDetailsSchema = z.object({
  handle: z.string(),
});

const OFFER_DATE_PASSED_MESSAGE = "開催日を過ぎた日付は登録できません";

const translateNotPublishable = (
  body: UpstreamErrorBody,
): UpstreamErrorBody => {
  const details = notPublishableDetailsSchema.safeParse(body.details);
  if (!details.success) return body;

  return {
    error: body.error,
    code: body.code,
    missingRequirements: resolvePublishRequirementLabels(
      details.data.missingFields,
    ),
  };
};

const translateCoPerformerNotFound = (
  body: UpstreamErrorBody,
): UpstreamErrorBody => {
  const details = coPerformerNotFoundDetailsSchema.safeParse(body.details);
  if (!details.success) return body;

  return {
    error: `共演者のハンドル「${details.data.handle}」は登録されていません`,
    code: body.code,
  };
};

export const translateUpstreamBody = (
  body: UpstreamErrorBody,
): UpstreamErrorBody => {
  switch (body.code) {
    case "ProfileNotPublishableError":
      return translateNotPublishable(body);
    case "CoPerformerNotFoundError":
      return translateCoPerformerNotFound(body);
    case "OfferDatePassedError":
      return { error: OFFER_DATE_PASSED_MESSAGE, code: body.code };
    default:
      return body;
  }
};
