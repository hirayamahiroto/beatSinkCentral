import type { ArtistProfile } from "../../entities";
import { createTypedError } from "../../../../utils/errors/createTypedError";

export type ProfileNotPublishableError = Error & {
  readonly type: "ProfileNotPublishableError";
  readonly missingFields: string[];
};

export const createProfileNotPublishableError = (
  missingFields: string[],
): ProfileNotPublishableError =>
  createTypedError("ProfileNotPublishableError", { missingFields });

export const isProfileNotPublishableError = (
  error: unknown,
): error is ProfileNotPublishableError =>
  error instanceof Error &&
  (error as Partial<ProfileNotPublishableError>).type ===
    "ProfileNotPublishableError";

// 公開可能条件（MVP 最小核 / profile-information-design.md §4）。
// 必須カラム（✅）が揃っていることを公開のゲートとする：
//   名前 / 画像 / Story / ジャンル（最低1）/ SNS リンク（最低1）
// タグライン・活動情報は「任意」フィールドのためゲート対象外とする。
// ※「公開可能条件の具体」は同 §6 で未決。確定したらこのポリシーを更新する。
export const collectMissingPublishFields = (
  profile: ArtistProfile,
): string[] => {
  const missing: string[] = [];
  if (!profile.getName()) missing.push("name");
  if (!profile.getImageUrl()) missing.push("imageUrl");
  if (!profile.getStory()) missing.push("story");
  if (profile.getGenres().length === 0) missing.push("genres");
  if (profile.getSnsLinks().length === 0) missing.push("snsLinks");
  return missing;
};

export const assertProfilePublishable = (profile: ArtistProfile): void => {
  const missing = collectMissingPublishFields(profile);
  if (missing.length > 0) {
    throw createProfileNotPublishableError(missing);
  }
};
