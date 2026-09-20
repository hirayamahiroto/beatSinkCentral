import type {
  DraftProfile,
  ProfileContent,
  ProfileState,
  PublishableContent,
  PublishedProfile,
  StoredProfile,
} from "../../entities";
import { draftIfAbsent } from "../../behaviors";
import { REQUIRED_STORY_QUESTION_CODE } from "../../valueObjects/storyChapter";
import { createTypedError } from "../../../../utils/errors/createTypedError";
import { type Result, ok, err, map } from "../../../../utils/result";

type PublishRequiredField = "name" | "imageUrl" | "story" | "genres" | "links";

export type ProfileNotPublishableError = Error & {
  readonly type: "ProfileNotPublishableError";
  readonly missingFields: PublishRequiredField[];
};

const createProfileNotPublishableError = (
  missingFields: PublishRequiredField[],
): ProfileNotPublishableError =>
  createTypedError("ProfileNotPublishableError", { missingFields });

const nonEmpty = <T>(items: readonly T[]): readonly [T, ...T[]] | null => {
  const [first, ...rest] = items;
  return first === undefined ? null : [first, ...rest];
};

const hasRequiredChapter = (content: ProfileContent): boolean =>
  content.chapters.some(
    (chapter) => chapter.questionCode === REQUIRED_STORY_QUESTION_CODE,
  );

export const toPublishableContent = (
  content: ProfileContent,
): Result<PublishableContent, ProfileNotPublishableError> => {
  const chapters = hasRequiredChapter(content)
    ? nonEmpty(content.chapters)
    : null;
  const genres = nonEmpty(content.genres);
  const links = nonEmpty(content.links);

  const missingFields: PublishRequiredField[] = [];
  if (content.name === null) missingFields.push("name");
  if (content.imageUrl === null) missingFields.push("imageUrl");
  if (chapters === null) missingFields.push("story");
  if (genres === null) missingFields.push("genres");
  if (links === null) missingFields.push("links");

  if (
    content.name === null ||
    content.imageUrl === null ||
    chapters === null ||
    genres === null ||
    links === null
  ) {
    return err(createProfileNotPublishableError(missingFields));
  }

  return ok({
    ...content,
    name: content.name,
    imageUrl: content.imageUrl,
    chapters,
    genres,
    links,
  });
};

export type Publishability = {
  ok: boolean;
  missingFields: PublishRequiredField[];
};

export const assessPublishability = (
  content: ProfileContent,
): Publishability => {
  const publishable = toPublishableContent(content);
  return publishable.ok
    ? { ok: true, missingFields: [] }
    : { ok: false, missingFields: publishable.error.missingFields };
};

const settle = (
  before: StoredProfile,
  after: ProfileContent,
): StoredProfile => {
  if (before.kind === "draft") return { ...before, content: after };

  const publishable = toPublishableContent(after);
  return publishable.ok
    ? { ...before, content: publishable.value }
    : {
        kind: "draft",
        id: before.id,
        artistId: before.artistId,
        content: after,
      };
};

export const edit = (
  state: ProfileState,
  change: (content: ProfileContent) => ProfileContent,
): StoredProfile => {
  const stored = draftIfAbsent(state);
  return settle(stored, change(stored.content));
};

export const publish = (
  state: DraftProfile,
): Result<PublishedProfile, ProfileNotPublishableError> =>
  map(toPublishableContent(state.content), (content) => ({
    kind: "published",
    id: state.id,
    artistId: state.artistId,
    content,
  }));
