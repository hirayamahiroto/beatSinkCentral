import { Badge } from "@ui/design-system/components/atoms/Badge";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Image } from "@ui/design-system/components/atoms/Image";
import { Link } from "@ui/design-system/components/atoms/Link";
import { Stack } from "@ui/design-system/components/atoms/Stack";
import { Typography } from "@ui/design-system/components/atoms/Typography";

type PublicArtistProfileLink = {
  label: string;
  url: string;
};

export type { PublicArtistProfileLink };

type PublicArtistProfileProps = {
  name: string;
  tagline: string | null;
  imageUrl: string | null;
  story: string | null;
  activityInfo: string | null;
  genres: string[];
  links: PublicArtistProfileLink[];
};

const toParagraphs = (story: string | null): string[] =>
  story === null
    ? []
    : story
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0);

export const PublicArtistProfile = ({
  name,
  tagline,
  imageUrl,
  story,
  activityInfo,
  genres,
  links,
}: PublicArtistProfileProps) => {
  const storyParagraphs = toParagraphs(story);

  return (
    <Stack gap="lg">
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
              <Typography variant="p" tone="muted">
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

      {storyParagraphs.length > 0 && (
        <Card>
          <Stack gap="sm">
            <Typography variant="h4">Story</Typography>
            <Stack gap="md">
              {storyParagraphs.map((paragraph) => (
                <Typography key={paragraph} variant="p">
                  {paragraph}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Card>
      )}

      {activityInfo && (
        <Card>
          <Stack gap="sm">
            <Typography variant="h4">活動情報</Typography>
            <Typography variant="p">{activityInfo}</Typography>
          </Stack>
        </Card>
      )}

      {links.length > 0 && (
        <Card>
          <Stack gap="sm">
            <Typography variant="h4">リンク</Typography>
            <Stack gap="sm">
              {links.map((link) => (
                <Link
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};
PublicArtistProfile.displayName = "PublicArtistProfile";
