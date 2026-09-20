import { describe, it, expect } from "vitest";
import {
  assessPublishability,
  edit,
  publish,
  toPublishableContent,
} from "./index";
import {
  reconstructStoredProfile,
  type ReconstructArtistProfileParams,
} from "../../factories";
import { reviseAttributes } from "../../behaviors";

const full = {
  id: "profile-1",
  artistId: "artist-1",
  published: false,
  name: "Taro",
  imageUrl: "https://example.com/a.png",
  chapters: [{ questionCode: "beginning", body: "私の歩み" }],
  genres: ["bass"],
  links: [{ linkTypeCode: "x", url: "https://x.com/taro" }],
};

const contentOf = (params: Partial<ReconstructArtistProfileParams>) =>
  reconstructStoredProfile({ ...full, ...params }).content;

describe("toPublishableContent", () => {
  it("最小核が揃っていれば非 null・非空に絞った内容を ok で返す", () => {
    const result = toPublishableContent(contentOf({}));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name.value).toBe("Taro");
      expect(result.value.imageUrl.value).toBe("https://example.com/a.png");
      expect(result.value.genres[0].value).toBe("bass");
      expect(result.value.links[0].linkTypeCode).toBe("x");
    }
  });

  it("不足しているフィールド名を固定順で列挙する", () => {
    const result = toPublishableContent(
      contentOf({
        name: null,
        imageUrl: null,
        chapters: [],
        genres: [],
        links: [],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ProfileNotPublishableError");
      expect(result.error.missingFields).toEqual([
        "name",
        "imageUrl",
        "story",
        "genres",
        "links",
      ]);
    }
  });

  it("始まりの章が無く転機・コンセプトのみでは story が不足扱いになる", () => {
    const result = toPublishableContent(
      contentOf({
        chapters: [{ questionCode: "turning_point", body: "転機" }],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.missingFields).toEqual(["story"]);
  });

  it("タグライン・活動情報は公開ゲート対象外", () => {
    expect(
      toPublishableContent(contentOf({ tagline: null, activityInfo: null })).ok,
    ).toBe(true);
  });
});

describe("assessPublishability", () => {
  it("揃っていれば ok:true と空の missingFields、不足があれば ok:false と不足一覧", () => {
    expect(assessPublishability(contentOf({}))).toStrictEqual({
      ok: true,
      missingFields: [],
    });
    expect(
      assessPublishability(contentOf({ chapters: [], links: [] })),
    ).toStrictEqual({ ok: false, missingFields: ["story", "links"] });
  });
});

describe("edit（内容を差し替えた後の状態の決め直し）", () => {
  it("下書きは内容を差し替えても下書きのまま", () => {
    const draft = reconstructStoredProfile(full);

    const settled = edit(draft, () => contentOf({ name: null }));

    expect(settled.kind).toBe("draft");
    expect(settled.id).toBe("profile-1");
    expect(settled.content.name).toBeNull();
  });

  it("公開中は必須条件を保つ内容なら公開のまま", () => {
    const stored = reconstructStoredProfile({ ...full, published: true });

    const settled = edit(stored, () => contentOf({ tagline: "新しい一言" }));

    expect(settled.kind).toBe("published");
    expect(settled.content.tagline?.value).toBe("新しい一言");
  });

  it("公開中に必須条件を割る内容は下書きへ降ろす（ID と内容は保つ）", () => {
    const stored = reconstructStoredProfile({ ...full, published: true });

    const settled = edit(stored, () => contentOf({ imageUrl: null }));

    expect(settled.kind).toBe("draft");
    expect(settled.id).toBe("profile-1");
    expect(settled.content.imageUrl).toBeNull();
    expect(settled.content.name?.value).toBe("Taro");
  });
});

describe("edit（状態の起こし方）", () => {
  it("プロフィールが無ければ下書きを起こして変更を適用する", () => {
    const edited = edit({ kind: "noProfile", artistId: "artist-9" }, (c) =>
      reviseAttributes(c, {
        name: contentOf({}).name,
        tagline: null,
        genres: [],
        activityInfo: null,
      }),
    );

    expect(edited.kind).toBe("draft");
    expect(edited.artistId).toBe("artist-9");
    expect(edited.id).toBeTruthy();
    expect(edited.content.name?.value).toBe("Taro");
  });

  it("公開中の編集は必須条件を割れば下書きに落ちる", () => {
    const stored = reconstructStoredProfile({ ...full, published: true });

    const kept = edit(stored, (c) => c);
    const dropped = edit(stored, (c) => ({ ...c, links: [] }));

    expect(kept.kind).toBe("published");
    expect(dropped.kind).toBe("draft");
  });
});

describe("publish", () => {
  it("最小核が揃った下書きは公開中になる", () => {
    const draft = reconstructStoredProfile(full);
    if (draft.kind !== "draft") throw new Error("fixture");

    const result = publish(draft);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("published");
      expect(result.value.id).toBe("profile-1");
      expect(result.value.content.name.value).toBe("Taro");
    }
  });

  it("不足があれば不足フィールドを載せた err を返す", () => {
    const draft = reconstructStoredProfile({
      ...full,
      chapters: [],
      links: [],
    });
    if (draft.kind !== "draft") throw new Error("fixture");

    const result = publish(draft);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe("ProfileNotPublishableError");
      expect(result.error.missingFields).toEqual(["story", "links"]);
    }
  });
});
