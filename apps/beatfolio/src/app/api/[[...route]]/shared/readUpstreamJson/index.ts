import { createUpstreamContractViolationError } from "../../errors/upstreamContractViolation";

export const readUpstreamJson = async <Body>(res: {
  status: number;
  json: () => Promise<Body>;
}): Promise<Body> => {
  try {
    return await res.json();
  } catch {
    throw createUpstreamContractViolationError({
      upstreamStatus: res.status,
      reason: "unparsable body",
    });
  }
};
