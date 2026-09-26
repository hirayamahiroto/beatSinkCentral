import { createUpstreamContractViolationError } from "../../errors/upstreamContractViolation";
import { throwBffError } from "../../../../../errorMap";

export const readUpstreamJson = async <Body>(res: {
  status: number;
  json: () => Promise<Body>;
}): Promise<Body> => {
  try {
    return await res.json();
  } catch {
    throwBffError(
      createUpstreamContractViolationError({
        upstreamStatus: res.status,
        reason: "unparsable body",
      }),
    );
  }
};
