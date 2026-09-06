import React from "react";
import { Badge } from "@ui/design-system/components/atoms/Badge";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Image } from "@ui/design-system/components/atoms/Image";
import { Input } from "@ui/design-system/components/atoms/Input";
import { Link } from "@ui/design-system/components/atoms/Link";
import { Stack } from "@ui/design-system/components/atoms/Stack";
import { Typography } from "@ui/design-system/components/atoms/Typography";

type AudienceStoryChapter = {
  question: string;
  body: string;
};

type AudienceOfferPerformer = {
  name: string;
  profileUrl: string | null;
};

type AudienceOffer = {
  dateLabel: string;
  venue: string;
  ticketUrl: string;
  comment: string;
  performers: AudienceOfferPerformer[];
};

type AudienceListeningPoint = {
  embedUrl: string;
  comment: string;
};

type AudienceSupportLink = {
  label: string;
  url: string;
};

type OfferClickPosition = "hero" | "after-story";

type StoryScrollDepth = 25 | 50 | 75 | 100;

const STORY_SCROLL_DEPTHS: readonly StoryScrollDepth[] = [25, 50, 75, 100];

const ABOVE_VIEWPORT_BOTTOM_ROOT_MARGIN = "100000px 0px 0px 0px";

const reachedStoryScrollDepths = (
  readChapterCount: number,
  chapterCount: number,
): StoryScrollDepth[] => {
  const readPercent = Math.floor((readChapterCount * 100) / chapterCount);
  return STORY_SCROLL_DEPTHS.filter((depth) => depth <= readPercent);
};

export type {
  AudienceStoryChapter,
  AudienceOfferPerformer,
  AudienceOffer,
  AudienceListeningPoint,
  AudienceSupportLink,
  OfferClickPosition,
};

type AudienceArtistProfileProps = {
  name: string;
  tagline: string | null;
  imageUrl: string | null;
  genres: string[];
  storyChapters: AudienceStoryChapter[];
  translation: string | null;
  listeningPoint: AudienceListeningPoint | null;
  offer: AudienceOffer | null;
  supportLinks: AudienceSupportLink[];
  onStoryExpand: () => void;
  onStoryScroll: (depth: StoryScrollDepth) => void;
  onOfferClick: (position: OfferClickPosition) => void;
  onSupportClick: (label: string) => void;
  onNotifySubscribe: (email: string) => void;
};

export const AudienceArtistProfile = ({
  name,
  tagline,
  imageUrl,
  genres,
  storyChapters,
  translation,
  listeningPoint,
  offer,
  supportLinks,
  onStoryExpand,
  onStoryScroll,
  onOfferClick,
  onSupportClick,
  onNotifySubscribe,
}: AudienceArtistProfileProps) => {
  const [storyExpanded, setStoryExpanded] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [subscribed, setSubscribed] = React.useState(false);

  const [firstChapter, ...restChapters] = storyChapters;
  const visibleChapters =
    storyExpanded || firstChapter === undefined
      ? storyChapters
      : [firstChapter];

  const chapterEndRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const firedDepthsRef = React.useRef<Set<StoryScrollDepth>>(new Set());

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const chapterCount = storyChapters.length;
    if (chapterCount === 0) return;

    const indexByElement = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = indexByElement.get(entry.target);
          if (!entry.isIntersecting || index === undefined) return;
          reachedStoryScrollDepths(index + 1, chapterCount).forEach((depth) => {
            if (firedDepthsRef.current.has(depth)) return;
            firedDepthsRef.current.add(depth);
            onStoryScroll(depth);
          });
        });
      },
      { rootMargin: ABOVE_VIEWPORT_BOTTOM_ROOT_MARGIN },
    );

    chapterEndRefs.current
      .slice(0, visibleChapters.length)
      .forEach((element, index) => {
        if (element === null) return;
        indexByElement.set(element, index);
        observer.observe(element);
      });

    return () => observer.disconnect();
  }, [onStoryScroll, storyChapters.length, visibleChapters.length]);

  const expandStory = () => {
    setStoryExpanded(true);
    onStoryExpand();
  };

  const submitSubscription = () => {
    onNotifySubscribe(email);
    setEmail("");
    setSubscribed(true);
  };

  return (
    <div className="relative">
      <Stack gap="lg">
        {offer && (
          <div className="sticky top-4 z-10">
            <Card className="flex items-center justify-between gap-4 p-4">
              <Stack gap="sm">
                <Typography variant="small" tone="muted">
                  {offer.dateLabel} / {offer.venue}
                </Typography>
                <Typography variant="p">{offer.comment}</Typography>
              </Stack>
              <Link
                href={offer.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onOfferClick("hero")}
              >
                <Button>チケットを取る</Button>
              </Link>
            </Card>
          </div>
        )}

        <Card>
          <Stack gap="md">
            {imageUrl && (
              <div className="overflow-hidden rounded-md">
                <Image
                  src={imageUrl}
                  alt={name}
                  className="h-64 w-full object-cover"
                />
              </div>
            )}

            <Stack gap="sm">
              <Typography variant="h2">{name}</Typography>
              {tagline && (
                <Typography variant="lead" tone="muted">
                  {tagline}
                </Typography>
              )}
            </Stack>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Badge key={genre}>{genre}</Badge>
                ))}
              </div>
            )}
          </Stack>
        </Card>

        {visibleChapters.length > 0 && (
          <Card>
            <Stack gap="md">
              {visibleChapters.map((chapter, index) => (
                <div key={chapter.question}>
                  <Stack gap="sm">
                    <Typography variant="h4">{chapter.question}</Typography>
                    <Typography variant="p">{chapter.body}</Typography>
                  </Stack>
                  <div
                    ref={(element) => {
                      chapterEndRefs.current[index] = element;
                    }}
                    aria-hidden="true"
                  />
                </div>
              ))}
              {!storyExpanded && restChapters.length > 0 && (
                <div>
                  <Button variant="outline" onClick={expandStory}>
                    続きを読む
                  </Button>
                </div>
              )}
            </Stack>
          </Card>
        )}

        {translation && (
          <Card className="border-purple-400/40">
            <Stack gap="sm">
              <Typography variant="small" tone="muted">
                運営による紹介
              </Typography>
              <Typography variant="p">{translation}</Typography>
            </Stack>
          </Card>
        )}

        {listeningPoint && (
          <Card>
            <Stack gap="sm">
              <Typography variant="h4">聴きどころ</Typography>
              <div className="aspect-video overflow-hidden rounded-md">
                <iframe
                  src={listeningPoint.embedUrl}
                  title={`${name} の聴きどころ`}
                  className="h-full w-full"
                  allowFullScreen
                />
              </div>
              <Typography variant="p" tone="muted">
                {listeningPoint.comment}
              </Typography>
            </Stack>
          </Card>
        )}

        {offer ? (
          <Card>
            <Stack gap="md">
              <Typography variant="lead">{offer.comment}</Typography>
              <Typography variant="p" tone="muted">
                {offer.dateLabel} / {offer.venue}
              </Typography>
              <div>
                <Link
                  href={offer.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onOfferClick("after-story")}
                >
                  <Button>チケットを取る</Button>
                </Link>
              </div>
            </Stack>
          </Card>
        ) : (
          supportLinks.length > 0 && (
            <Card>
              <Stack gap="md">
                <Typography variant="h4">応援する</Typography>
                <div className="flex flex-wrap gap-3">
                  {supportLinks.map((link) => (
                    <Link
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onSupportClick(link.label)}
                    >
                      <Button variant="outline">{link.label}</Button>
                    </Link>
                  ))}
                </div>
              </Stack>
            </Card>
          )
        )}

        <Card>
          <Stack gap="md">
            <Typography variant="h4">次の告知を受け取る</Typography>
            {subscribed ? (
              <Typography variant="p" tone="muted">
                登録しました。次のライブが決まったらお知らせします。
              </Typography>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="email"
                  value={email}
                  placeholder="メールアドレス"
                  onChange={(event) => setEmail(event.target.value)}
                  className="max-w-xs"
                />
                <Button disabled={email === ""} onClick={submitSubscription}>
                  受け取る
                </Button>
              </div>
            )}
            {offer && supportLinks.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {supportLinks.map((link) => (
                  <Link
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onSupportClick(link.label)}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </Stack>
        </Card>

        {offer && offer.performers.length > 0 && (
          <Card>
            <Stack gap="md">
              <Typography variant="h4">共演</Typography>
              <div className="flex flex-wrap items-center gap-3">
                {offer.performers.map((performer) =>
                  performer.profileUrl !== null ? (
                    <Link
                      key={performer.name}
                      href={performer.profileUrl}
                      className="text-sm underline-offset-4 hover:underline"
                    >
                      {performer.name}
                    </Link>
                  ) : (
                    <span
                      key={performer.name}
                      className="flex items-center gap-2"
                    >
                      <Typography variant="small" tone="muted">
                        {performer.name}
                      </Typography>
                      <Badge>招待できます</Badge>
                    </span>
                  ),
                )}
              </div>
            </Stack>
          </Card>
        )}
      </Stack>
    </div>
  );
};
AudienceArtistProfile.displayName = "AudienceArtistProfile";
