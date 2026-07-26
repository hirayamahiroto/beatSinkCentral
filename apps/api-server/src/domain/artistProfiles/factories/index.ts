import { createProfileName } from "../valueObjects/profileName";
import { createTagline } from "../valueObjects/tagline";
import { createImageUrl } from "../valueObjects/imageUrl";
import { createStory } from "../valueObjects/story";
import { createActivityInfo } from "../valueObjects/activityInfo";
import { createGenre } from "../valueObjects/genre";
import {
  createProfileLink,
  type ProfileLinkInput,
} from "../valueObjects/profileLink";
import type {
  ArtistProfile,
  DraftProfile,
  ProfileContentFields,
} from "../entities";

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
  values === undefined
    ? []
    : values
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .map(createGenre);

const toLinks = (values: ProfileLinkInput[] | undefined) =>
  values === undefined
    ? []
    : values
        .filter((value) => value.url.trim().length > 0)
        .map(createProfileLink);

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
): ProfileContentFields => ({
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
): DraftProfile => ({
  _tag: "Draft",
  id: crypto.randomUUID(),
  artistId: params.artistId,
  ...buildContentFields(params),
});

export type ReconstructArtistProfileParams = ArtistProfileContent & {
  id: string;
  artistId: string;
  published: boolean;
};

export const reconstructArtistProfile = (
  params: ReconstructArtistProfileParams,
): ArtistProfile => {
  const identity = { id: params.id, artistId: params.artistId };
  const content = buildContentFields(params);
  return params.published
    ? { _tag: "Published", ...identity, ...content }
    : { _tag: "Draft", ...identity, ...content };
};
