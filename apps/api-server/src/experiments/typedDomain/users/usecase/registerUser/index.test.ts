import { describe, it, expect } from "vitest";
import { registerUserUsecase, type RegisterUserUsecaseDeps } from "./index";
import type { RegisteredUser } from "../../user";
import type { UserRepositoryPort } from "../../repository";

const createFakeRepository = (seed: RegisteredUser[] = []) => {
  const store = [...seed];
  const port: UserRepositoryPort = {
    findRegisteredBySub: async (sub) =>
      store.find((u) => u.sub.value === sub) ?? null,
    save: async (user) => {
      store.push(user);
    },
  };
  return { port, store };
};

const fixedId = () => "generated-id";

const buildDeps = (
  repository: UserRepositoryPort,
): RegisterUserUsecaseDeps => ({
  userRepository: repository,
  newId: fixedId,
});

describe("registerUserUsecase", () => {
  it("未登録なら workflow を通して保存し、ok(RegisteredUser) を返す", async () => {
    const { port, store } = createFakeRepository();

    const result = await registerUserUsecase(buildDeps(port))({
      sub: "auth0|new",
      email: "new@example.com",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe("generated-id");
      expect(result.value.sub.value).toBe("auth0|new");
    }
    expect(store).toHaveLength(1);
  });

  it("登録済みなら err(UserAlreadyRegisteredError) を返し、保存しない", async () => {
    const existing: RegisteredUser = {
      status: "registered",
      id: "existing-id",
      sub: { _tag: "Sub", value: "auth0|existing" },
      email: { _tag: "Email", value: "existing@example.com" },
    };
    const { port, store } = createFakeRepository([existing]);

    const result = await registerUserUsecase(buildDeps(port))({
      sub: "auth0|existing",
      email: "new@example.com",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("UserAlreadyRegisteredError");
    }
    expect(store).toHaveLength(1);
  });

  it("入力が不正なら err を返し、保存しない", async () => {
    const { port, store } = createFakeRepository();

    const result = await registerUserUsecase(buildDeps(port))({
      sub: "auth0|new",
      email: "invalid",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("InvalidEmailFormatError");
    }
    expect(store).toHaveLength(0);
  });
});
