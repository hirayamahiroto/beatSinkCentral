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
  type ProfileLink,
  type ProfileLinkInput,
} from "../valueObjects/profileLink";
import { createArtistProfileBehaviors } from "../behaviors";
import type { ArtistProfile, ArtistProfileState } from "../entities";
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
): Result<Genre[], InvalidGenreFormatError> => {
  if (values === undefined) return ok([]);
  return traverse(
    values.map((value) => value.trim()).filter((value) => value.length > 0),
    createGenre,
  );
};

const toLinks = (
  values: ProfileLinkInput[] | undefined,
): Result<ProfileLink[], CreateProfileLinkError> => {
  if (values === undefined) return ok([]);
  return traverse(
    values.filter((value) => value.url.trim().length > 0),
    createProfileLink,
  );
};

export type ArtistProfileContent = {
  name?: string | null;
  tagline?: string | null;
  imageUrl?: string | null;
  story?: string | null;
  activityInfo?: string | null;
  genres?: string[];
  links?: ProfileLinkInput[];
};

type ProfileIdentity = {
  id: string;
  artistId: string;
  published: boolean;
};

const buildState = (
  base: ProfileIdentity,
  content: ArtistProfileContent,
): Result<ArtistProfileState, ArtistProfileContentError> =>
  map(
    all({
      name: optional(content.name, createProfileName),
      tagline: optional(content.tagline, createTagline),
      imageUrl: optional(content.imageUrl, createImageUrl),
      story: optional(content.story, createStory),
      activityInfo: optional(content.activityInfo, createActivityInfo),
      genres: toGenres(content.genres),
      links: toLinks(content.links),
    }),
    (fields) => ({
      id: base.id,
      artistId: base.artistId,
      published: base.published,
      ...fields,
    }),
  );

export type CreateArtistProfileParams = ArtistProfileContent & {
  artistId: string;
};

export const createArtistProfile = (
  params: CreateArtistProfileParams,
): Result<ArtistProfile, ArtistProfileContentError> =>
  map(
    buildState(
      { id: crypto.randomUUID(), artistId: params.artistId, published: false },
      params,
    ),
    createArtistProfileBehaviors,
  );

export type ReviseArtistProfileParams = ArtistProfileContent & {
  id: string;
  artistId: string;
  published: boolean;
};

export const reviseArtistProfile = (
  params: ReviseArtistProfileParams,
): Result<ArtistProfile, ArtistProfileContentError> =>
  map(
    buildState(
      { id: params.id, artistId: params.artistId, published: params.published },
      params,
    ),
    createArtistProfileBehaviors,
  );

export type ReconstructArtistProfileParams = ReviseArtistProfileParams;

export const reconstructArtistProfile = (
  params: ReconstructArtistProfileParams,
): ArtistProfile =>
  unwrapOrThrow(
    reviseArtistProfile(params),
    "reconstructArtistProfile: stored profile has invalid field values",
  );
