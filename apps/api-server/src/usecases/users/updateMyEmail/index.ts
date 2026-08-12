import {
  createEmail,
  type InvalidEmailFormatError,
} from "../../../domain/users/valueObjects/email";
import type { WriteCapabilities } from "../../capabilities";
import { type Result, ok } from "../../../utils/result";

export type UpdateMyEmailInput = {
  email: string;
};

export type UpdateMyEmailOutput = {
  userId: string;
  email: string;
};

export type UpdateMyEmailError = InvalidEmailFormatError;

type UpdateMyEmailCaps = Pick<WriteCapabilities, "actor" | "users">;

export const updateMyEmail = async (
  caps: UpdateMyEmailCaps,
  input: UpdateMyEmailInput,
): Promise<Result<UpdateMyEmailOutput, UpdateMyEmailError>> => {
  const newEmail = createEmail(input.email);
  if (!newEmail.ok) return newEmail;

  const updated = caps.actor.user.changeEmail(newEmail.value);
  const saved = await caps.users.updateEmail({
    id: updated.getId(),
    email: updated.getEmail(),
  });

  return ok({
    userId: saved.getId(),
    email: saved.getEmail(),
  });
};
