import { describe, it, expect } from "vitest";
import { createMyArtistNotFoundError } from "./index";

describe("createMyArtistNotFoundError", () => {
  it("type が MyArtistNotFoundError の Error を作る", () => {
    const error = createMyArtistNotFoundError();

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("MyArtistNotFoundError");
    expect(error.message).toBe("MyArtistNotFoundError");
  });
});
