import { describe, it, expect } from "vitest";
import { defineUsecase } from "./index";

type UserRepository = {
  findBySub: (sub: string) => string | null;
};
type TxRunner = {
  run: <T>(fn: () => Promise<T>) => Promise<T>;
};
type ArtistRepository = {
  findByAccountId: (accountId: string) => string | null;
};

type UpdateMyEmailDeps = {
  userRepository: UserRepository;
  txRunner: TxRunner;
};

const updateMyEmail = defineUsecase<
  UpdateMyEmailDeps,
  { sub: string },
  string | null
>(
  (deps) => (input) =>
    deps.txRunner.run(async () => deps.userRepository.findBySub(input.sub)),
);

const userRepository: UserRepository = {
  findBySub: (sub) => (sub === "known" ? "user-1" : null),
};
const txRunner: TxRunner = { run: (fn) => fn() };
const artistRepository: ArtistRepository = { findByAccountId: () => null };

const container = { userRepository, txRunner, artistRepository };

describe("defineUsecase — 受け渡しの上限を型で締める", () => {
  it("必要な deps ちょうどで束ねると実行できる", async () => {
    const bound = updateMyEmail({ userRepository, txRunner });
    expect(await bound({ sub: "known" })).toBe("user-1");
    expect(await bound({ sub: "unknown" })).toBeNull();
  });

  it("余分を含む container を渡すと弾かれる（過剰提供）", () => {
    // @ts-expect-error artistRepository は UpdateMyEmailDeps に無い → never 制約で弾かれる
    updateMyEmail(container);
    // @ts-expect-error スプレッドでも余剰キーは弾かれる（excess property check に依存しない）
    updateMyEmail({ ...container });
  });

  it("必須 deps が不足すると弾かれる（渡し忘れ）", () => {
    // @ts-expect-error txRunner 不足
    updateMyEmail({ userRepository });
  });
});
