import type { OfferView } from "../../../domain/offers/entities";
import {
  createOffer,
  createOfferContent,
  type OfferContentError,
} from "../../../domain/offers/factories";
import type { CoPerformerInput } from "../../../domain/offers/valueObjects/coPerformer";
import {
  createCoPerformerNotFoundError,
  type CoPerformerNotFoundError,
} from "../../../domain/offers/errors/coPerformerNotFound";
import {
  createHandle,
  type Handle,
  type InvalidHandleFormatError,
} from "../../../domain/artists/valueObjects/handle";
import type { Artist } from "../../../domain/artists/entities";
import {
  ensureOfferDateNotPassed,
  type OfferDatePassedError,
} from "../../../domain/offers/policies/activity";
import type { ArtistWriteCapabilities } from "../../capabilities";
import { findMyActiveOffer } from "../findMyActiveOffer";
import { type Result, ok, err, map, traverse } from "../../../utils/result";

type ReplaceMyOfferCoPerformerInput = {
  name: string;
  handle: string | null;
};

export type ReplaceMyOfferInput = {
  date: string;
  place: string;
  ticketUrl: string;
  comment: string;
  coPerformers: ReplaceMyOfferCoPerformerInput[];
};

export type ReplaceMyOfferOutput = {
  offer: OfferView;
};

export type ReplaceMyOfferError =
  | OfferContentError
  | InvalidHandleFormatError
  | CoPerformerNotFoundError
  | OfferDatePassedError;

type ReplaceMyOfferCaps = Pick<
  ArtistWriteCapabilities,
  "actor" | "artists" | "offers"
>;

type NamedHandle = {
  name: string;
  handle: Handle | null;
};

const toNamedHandle = (
  coPerformer: ReplaceMyOfferCoPerformerInput,
): Result<NamedHandle, InvalidHandleFormatError> =>
  coPerformer.handle === null || coPerformer.handle.trim().length === 0
    ? ok({ name: coPerformer.name, handle: null })
    : map(createHandle(coPerformer.handle), (handle) => ({
        name: coPerformer.name,
        handle,
      }));

const toCoPerformerInput =
  (artistByHandle: Map<string, Artist>) =>
  ({
    name,
    handle,
  }: NamedHandle): Result<CoPerformerInput, CoPerformerNotFoundError> => {
    if (handle === null) return ok({ name, artist: null });
    const artist = artistByHandle.get(handle.value);
    if (artist === undefined) {
      return err(createCoPerformerNotFoundError(handle.value));
    }
    return ok({
      name,
      artist: { artistId: artist.getArtistId(), handle: artist.getHandle() },
    });
  };

const resolveCoPerformers = async (
  caps: Pick<ReplaceMyOfferCaps, "artists">,
  coPerformers: ReplaceMyOfferCoPerformerInput[],
): Promise<
  Result<
    CoPerformerInput[],
    InvalidHandleFormatError | CoPerformerNotFoundError
  >
> => {
  const namedHandles = traverse(coPerformers, toNamedHandle);
  if (!namedHandles.ok) return namedHandles;

  const handles = [
    ...new Set(
      namedHandles.value.flatMap(({ handle }) =>
        handle === null ? [] : [handle.value],
      ),
    ),
  ];
  const artists =
    handles.length === 0 ? [] : await caps.artists.findByHandles(handles);
  const artistByHandle = new Map(
    artists.map((artist) => [artist.getHandle(), artist] as const),
  );

  return traverse(namedHandles.value, toCoPerformerInput(artistByHandle));
};

export const replaceMyOffer = async (
  caps: ReplaceMyOfferCaps,
  input: ReplaceMyOfferInput,
): Promise<Result<ReplaceMyOfferOutput, ReplaceMyOfferError>> => {
  const coPerformers = await resolveCoPerformers(caps, input.coPerformers);
  if (!coPerformers.ok) return coPerformers;

  const content = createOfferContent({
    date: input.date,
    place: input.place,
    ticketUrl: input.ticketUrl,
    comment: input.comment,
    coPerformers: coPerformers.value,
  });
  if (!content.ok) return content;

  const dateNotPassed = ensureOfferDateNotPassed(
    content.value.date,
    new Date(),
  );
  if (!dateNotPassed.ok) return dateNotPassed;

  const active = await findMyActiveOffer(caps);
  const offer =
    active === null
      ? createOffer({
          artistId: caps.actor.artist.getArtistId(),
          content: content.value,
        })
      : active.revise(content.value);

  await caps.offers.upsert(offer.toPersistence());

  return ok({ offer: offer.toView() });
};
