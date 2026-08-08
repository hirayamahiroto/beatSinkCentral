import { describe, it, expect } from "vitest";
import { isUniqueViolation } from "./index";

const createPostgresError = (code: string, constraintName: string): Error =>
  Object.assign(new Error("duplicate key value violates unique constraint"), {
    code,
    constraint_name: constraintName,
  });

describe("isUniqueViolation", () => {
  it("指定した制約の一意制約違反を判別する", () => {
    const error = createPostgresError("23505", "artists_account_id_unique");

    expect(isUniqueViolation(error, "artists_account_id_unique")).toBe(true);
  });

  it("他の制約の一意制約違反は判別しない", () => {
    const error = createPostgresError("23505", "users_sub_id_unique");

    expect(isUniqueViolation(error, "artists_account_id_unique")).toBe(false);
  });

  it("一意制約違反以外のエラーは判別しない", () => {
    const error = createPostgresError("23503", "artists_account_id_unique");

    expect(isUniqueViolation(error, "artists_account_id_unique")).toBe(false);
  });

  it("Error でない値は判別しない", () => {
    expect(isUniqueViolation(null, "artists_account_id_unique")).toBe(false);
    expect(isUniqueViolation(undefined, "artists_account_id_unique")).toBe(
      false,
    );
    expect(
      isUniqueViolation(
        { code: "23505", constraint_name: "artists_account_id_unique" },
        "artists_account_id_unique",
      ),
    ).toBe(false);
  });
});
