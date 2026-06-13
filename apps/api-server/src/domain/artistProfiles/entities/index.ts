import type { ProfileName } from "../valueObjects/profileName";
import type { Tagline } from "../valueObjects/tagline";
import type { ImageUrl } from "../valueObjects/imageUrl";
import type { Story } from "../valueObjects/story";
import type { ActivityInfo } from "../valueObjects/activityInfo";
import type { Genre } from "../valueObjects/genre";
import type { SnsUrl } from "../valueObjects/snsUrl";

// 内部状態（behaviors/factories で使用）。
// 本文系は下書き保存を許すため null を取りうる（公開可否は publish ポリシーで判定）。
export type ArtistProfileState = {
  readonly id: string;
  readonly artistId: string;
  readonly name: ProfileName | null;
  readonly tagline: Tagline | null;
  readonly imageUrl: ImageUrl | null;
  readonly story: Story | null;
  readonly activityInfo: ActivityInfo | null;
  readonly genres: readonly Genre[];
  readonly snsLinks: readonly SnsUrl[];
  readonly published: boolean;
};

// 永続化用のプレーンデータ（Repository が消費する）。
export type ArtistProfilePersistenceData = {
  id: string;
  artistId: string;
  name: string | null;
  tagline: string | null;
  imageUrl: string | null;
  story: string | null;
  activityInfo: string | null;
  genres: string[];
  snsLinks: string[];
  published: boolean;
};

// プレゼンテーション用のビュー（編集フォーム / 公開詳細で使う）。
export type ArtistProfileView = {
  name: string | null;
  tagline: string | null;
  imageUrl: string | null;
  story: string | null;
  activityInfo: string | null;
  genres: string[];
  snsLinks: string[];
  published: boolean;
};

export type ArtistProfile = {
  getId: () => string;
  getArtistId: () => string;
  getName: () => string | null;
  getTagline: () => string | null;
  getImageUrl: () => string | null;
  getStory: () => string | null;
  getActivityInfo: () => string | null;
  getGenres: () => string[];
  getSnsLinks: () => string[];
  isPublished: () => boolean;
  publish: () => ArtistProfile;
  unpublish: () => ArtistProfile;
  toPersistence: () => ArtistProfilePersistenceData;
  toView: () => ArtistProfileView;
};
