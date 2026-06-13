import { createProfileName } from "../valueObjects/profileName";
import { createTagline } from "../valueObjects/tagline";
import { createImageUrl } from "../valueObjects/imageUrl";
import { createStory } from "../valueObjects/story";
import { createActivityInfo } from "../valueObjects/activityInfo";
import { createGenre } from "../valueObjects/genre";
import { createSnsUrl } from "../valueObjects/snsUrl";
import { createArtistProfileBehaviors } from "../behaviors";
import type { ArtistProfile, ArtistProfileState } from "../entities";

// 空文字・空白のみは「未入力（null）」として扱い、VO 検証に渡さない。
// 下書き保存（書きかけ）を許容するための正規化。
const optional = <T>(
  value: string | null | undefined,
  create: (raw: string) => T,
): T | null => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return create(trimmed);
};

const toGenres = (values: string[] | undefined) =>
  (values ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map(createGenre);

const toSnsLinks = (values: string[] | undefined) =>
  (values ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map(createSnsUrl);

export type ArtistProfileContent = {
  name?: string | null;
  tagline?: string | null;
  imageUrl?: string | null;
  story?: string | null;
  activityInfo?: string | null;
  genres?: string[];
  snsLinks?: string[];
};

const buildState = (
  base: { id: string; artistId: string; published: boolean },
  content: ArtistProfileContent,
): ArtistProfileState => ({
  id: base.id,
  artistId: base.artistId,
  name: optional(content.name, createProfileName),
  tagline: optional(content.tagline, createTagline),
  imageUrl: optional(content.imageUrl, createImageUrl),
  story: optional(content.story, createStory),
  activityInfo: optional(content.activityInfo, createActivityInfo),
  genres: toGenres(content.genres),
  snsLinks: toSnsLinks(content.snsLinks),
  published: base.published,
});

// 新規作成用（UseCase 層で使用）。ID はドメインが生成し、初期状態は非公開。
export type CreateArtistProfileParams = ArtistProfileContent & {
  artistId: string;
};

export const createArtistProfile = (
  params: CreateArtistProfileParams,
): ArtistProfile => {
  const state = buildState(
    { id: crypto.randomUUID(), artistId: params.artistId, published: false },
    params,
  );
  return createArtistProfileBehaviors(state);
};

// DB 復元用（Repository 層で使用）。ID と published は引数から受け取る。
export type ReconstructArtistProfileParams = ArtistProfileContent & {
  id: string;
  artistId: string;
  published: boolean;
};

export const reconstructArtistProfile = (
  params: ReconstructArtistProfileParams,
): ArtistProfile => {
  const state = buildState(
    { id: params.id, artistId: params.artistId, published: params.published },
    params,
  );
  return createArtistProfileBehaviors(state);
};
