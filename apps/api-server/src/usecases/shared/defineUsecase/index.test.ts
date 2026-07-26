import { describe, it, expect } from "vitest";
import { defineUsecase } from "./index";

type UserRepository = { findBySub: (sub: string) => string | null };
type TxRunner = { run: <T>(fn: () => Promise<T>) => Promise<T> };
type ArtistRepository = {
  findByAccountId: (accountId: string) => string | null;
};

type ExampleDeps = {
  userRepository: UserRepository;
  txRunner: TxRunner;
};

const exampleUsecase = defineUsecase<
  ExampleDeps,
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

describe("defineUsecase", () => {
  it("必要な deps ちょうどで束ねると実行できる", async () => {
    const bound = exampleUsecase({ userRepository, txRunner });
    expect(await bound({ sub: "known" })).toBe("user-1");
    expect(await bound({ sub: "unknown" })).toBeNull();
  });

  it("余分を含む container の受け渡しを型で弾く（過剰提供）", () => {
    // @ts-expect-error artistRepository は ExampleDeps に無い → never 制約で弾く
    exampleUsecase(container);
    // @ts-expect-error スプレッドでも余剰キーを弾く（excess property check に依存しない）
    exampleUsecase({ ...container });
  });

  it("必須 deps の渡し忘れを型で弾く", () => {
    // @ts-expect-error txRunner 不足
    exampleUsecase({ userRepository });
  });
});
