import { createConsoleLogger } from "../utils/logger";
import { createAppErrorHandler } from "./createAppErrorHandler";

export { throwAppError } from "./createAppErrorHandler";

export const { handleAppError, handleThrownError } = createAppErrorHandler(
  createConsoleLogger(),
);
