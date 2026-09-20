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
  createStoryChapter,
  createInvalidStoryChapterFormatError,
  type InvalidStoryChapterFormatError,
  type StoryChapter,
  type StoryChapterInput,
} from "../valueObjects/storyChapter";
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
import {
  createPresentationPatternCode,
  type InvalidPresentationPatternError,
} from "../valueObjects/presentationPattern";
import type {
  ArtistProfileAttributes,
  ProfileContent,
  StoredProfile,
} from "../entities";
import {
  toPublishableContent,
  type ProfileNotPublishableError,
} from "../policies/publishability";
import {
  type Result,
  ok,
  err,
  map,
  all,
  traverse,
  unwrapOrThrow,
} from "../../../utils/result";

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

const toChapters = (
  values: StoryChapterInput[] | undefined,
): Result<StoryChapter[], InvalidStoryChapterFormatError> => {
  if (values === undefined) return ok([]);
  const withBody = values.filter((value) => value.body.trim().length > 0);
  const codes = withBody.map((value) => value.questionCode);
  if (new Set(codes).size !== codes.length) {
    return err(createInvalidStoryChapterFormatError());
  }
  return traverse(withBody, createStoryChapter);
};

export type ArtistProfileAttributesContent = {
  name?: string | null;
  tagline?: string | null;
  genres?: string[];
  activityInfo?: string | null;
};

export type ArtistProfileAttributesError =
  | InvalidProfileNameFormatError
  | InvalidTaglineFormatError
  | InvalidGenreFormatError
  | InvalidActivityInfoFormatError;

export const createProfileAttributes = (
  content: ArtistProfileAttributesContent,
): Result<ArtistProfileAttributes, ArtistProfileAttributesError> =>
  all({
    name: optional(content.name, createProfileName),
    tagline: optional(content.tagline, createTagline),
    genres: toGenres(content.genres),
    activityInfo: optional(content.activityInfo, createActivityInfo),
  });

export const createProfileLinks = (
  values: ProfileLinkInput[],
): Result<ProfileLink[], CreateProfileLinkError> =>
  traverse(
    values.filter((value) => value.url.trim().length > 0),
    createProfileLink,
  );

type ArtistProfileContent = ArtistProfileAttributesContent & {
  imageUrl?: string | null;
  chapters?: StoryChapterInput[];
  links?: ProfileLinkInput[];
  presentationPatternCode?: string | null;
};

type ArtistProfileContentError =
  | ArtistProfileAttributesError
  | InvalidImageUrlFormatError
  | InvalidStoryChapterFormatError
  | CreateProfileLinkError
  | InvalidPresentationPatternError;

const buildContent = (
  content: ArtistProfileContent,
): Result<ProfileContent, ArtistProfileContentError> =>
  map(
    all({
      attributes: createProfileAttributes(content),
      imageUrl: optional(content.imageUrl, createImageUrl),
      chapters: toChapters(content.chapters),
      links:
        content.links === undefined
          ? ok([])
          : createProfileLinks(content.links),
      presentationPattern: optional(
        content.presentationPatternCode,
        createPresentationPatternCode,
      ),
    }),
    ({ attributes, imageUrl, chapters, links, presentationPattern }) => ({
      ...attributes,
      imageUrl,
      chapters,
      links,
      presentationPattern,
    }),
  );

export type ReconstructArtistProfileParams = ArtistProfileContent & {
  id: string;
  artistId: string;
  published: boolean;
};

const toStoredProfile = (
  params: ReconstructArtistProfileParams,
  content: ProfileContent,
): Result<StoredProfile, ProfileNotPublishableError> => {
  const identity = { id: params.id, artistId: params.artistId };
  if (!params.published) return ok({ kind: "draft", ...identity, content });
  return map(toPublishableContent(content), (publishable) => ({
    kind: "published",
    ...identity,
    content: publishable,
  }));
};

export const reconstructStoredProfile = (
  params: ReconstructArtistProfileParams,
): StoredProfile => {
  const content = unwrapOrThrow(
    buildContent(params),
    "reconstructStoredProfile: stored profile has invalid field values",
  );
  return unwrapOrThrow(
    toStoredProfile(params, content),
    "reconstructStoredProfile: published profile lacks required fields",
  );
};
