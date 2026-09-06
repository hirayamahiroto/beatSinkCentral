import { createConsoleLogger } from "../utils/logger";
import { createAppErrorHandler } from "./createAppErrorHandler";

export const handleAppError = createAppErrorHandler(createConsoleLogger());
