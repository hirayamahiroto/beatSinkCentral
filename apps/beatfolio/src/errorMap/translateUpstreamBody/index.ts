import { z } from "zod";
import type { UpstreamErrorBody } from "../../app/api/[[...route]]/errors/upstreamRejected";
import { resolvePublishRequirementLabels } from "../../app/api/[[...route]]/shared/resolvePublishRequirementLabels";

const notPublishableDetailsSchema = z.object({
  missingFields: z.array(z.string()),
});

export const translateUpstreamBody = (
  body: UpstreamErrorBody,
): UpstreamErrorBody => {
  if (body.code !== "ProfileNotPublishableError") return body;

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
