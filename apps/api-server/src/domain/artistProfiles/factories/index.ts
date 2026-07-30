import {
  createProfileName,
  type InvalidProfileNameFormatError,
} from "../valueObjects/profileName";
import {
  createTagline,
  type InvalidTaglineFormatError,
} from "../valueObjects/tagline";
import {
  createImageUrl,
  type InvalidImageUrlFormatError,
} from "../valueObjects/imageUrl";
import {
  createStory,
  type InvalidStoryFormatError,
} from "../valueObjects/story";
import {
  createActivityInfo,
  type InvalidActivityInfoFormatError,
} from "../valueObjects/activityInfo";
import {
  createGenre,
  type Genre,
  type InvalidGenreFormatError,
} from "../valueObjects/genre";
import {
  createProfileLink,
  type CreateProfileLinkError,
  type ProfileLinkInput,
} from "../valueObjects/profileLink";
import type {
  ArtistProfile,
  DraftProfile,
  ProfileContentFields,
} from "../entities";
import { publish } from "../operations";
import {
  type Result,
  ok,
  map,
  all,
  traverse,
  unwrapOrThrow,
} from "../../../utils/result";

export type ArtistProfileContentError =
  | InvalidProfileNameFormatError
  | InvalidTaglineFormatError
  | InvalidImageUrlFormatError
  | InvalidStoryFormatError
  | InvalidActivityInfoFormatError
  | InvalidGenreFormatError
  | CreateProfileLinkError;

const optional = <T, E>(
  value: string | null | undefined,
  create: (raw: string) => Result<T, E>,
): Result<T | null, E> => {
  if (value === null || value === undefined) return ok(null);
  const trimmed = value.trim();
  if (trimmed.length === 0) return ok(null);
  return create(trimmed);
};

const toGenres = (
  values: string[] | undefined,
): Result<Genre[], InvalidGenreFormatError> =>
  traverse(
    (values ?? [])
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
    createGenre,
  );

const toLinks = (values: ProfileLinkInput[] | undefined) =>
  traverse(
    (values ?? []).filter((value) => value.url.trim().length > 0),
    createProfileLink,
  );

export type ArtistProfileContent = {
  name?: string | null;
  tagline?: string | null;
  imageUrl?: string | null;
  story?: string | null;
  activityInfo?: string | null;
  genres?: string[];
  links?: ProfileLinkInput[];
};

const buildContentFields = (
  content: ArtistProfileContent,
): Result<ProfileContentFields, ArtistProfileContentError> =>
  all({
    name: optional(content.name, createProfileName),
    tagline: optional(content.tagline, createTagline),
    imageUrl: optional(content.imageUrl, createImageUrl),
    story: optional(content.story, createStory),
    activityInfo: optional(content.activityInfo, createActivityInfo),
    genres: toGenres(content.genres),
    links: toLinks(content.links),
  });

export type CreateArtistProfileParams = ArtistProfileContent & {
  artistId: string;
};

export const createArtistProfile = (
  params: CreateArtistProfileParams,
): Result<DraftProfile, ArtistProfileContentError> =>
  map(buildContentFields(params), (content) => ({
    _tag: "Draft" as const,
    id: crypto.randomUUID(),
    artistId: params.artistId,
    ...content,
  }));

export type ReviseArtistProfileParams = ArtistProfileContent & {
  id: string;
  artistId: string;
};

export const reviseArtistProfile = (
  params: ReviseArtistProfileParams,
): Result<DraftProfile, ArtistProfileContentError> =>
  map(buildContentFields(params), (content) => ({
    _tag: "Draft" as const,
    id: params.id,
    artistId: params.artistId,
    ...content,
  }));

export type ReconstructArtistProfileParams = ArtistProfileContent & {
  id: string;
  artistId: string;
  published: boolean;
};

export const reconstructArtistProfile = (
  params: ReconstructArtistProfileParams,
): ArtistProfile => {
  const content = unwrapOrThrow(
    buildContentFields(params),
    "reconstructArtistProfile: stored profile has invalid field values",
  );

  const draft: DraftProfile = {
    _tag: "Draft",
    id: params.id,
    artistId: params.artistId,
    ...content,
  };

  if (!params.published) return draft;

  return unwrapOrThrow(
    publish(draft),
    "reconstructArtistProfile: published profile is missing required fields",
  );
};
