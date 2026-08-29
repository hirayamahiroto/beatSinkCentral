import { Badge } from "@ui/design-system/components/atoms/Badge";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Stack } from "@ui/design-system/components/atoms/Stack";
import { Typography } from "@ui/design-system/components/atoms/Typography";

type ProfilePublishControlProps = {
  published: boolean;
  missingRequirements: string[];
  isLoading: boolean;
  error: string | null;
  onPublish: () => void;
  onUnpublish: () => void;
};

export const ProfilePublishControl = ({
  published,
  missingRequirements,
  isLoading,
  error,
  onPublish,
  onUnpublish,
}: ProfilePublishControlProps) => {
  const canPublish = missingRequirements.length === 0;

  return (
    <Card>
      <Stack gap="md">
        <div className="flex items-center gap-3">
          <Typography variant="h4">公開状態</Typography>
          <Badge variant={published ? "default" : "secondary"}>
            {published ? "公開中" : "非公開"}
          </Badge>
        </div>

        <Typography variant="small" tone="muted">
          {published
            ? "プレイヤー一覧と公開ページに表示されています。"
            : "保存した内容はまだ誰にも公開されていません。"}
        </Typography>

        {!published && !canPublish && (
          <Stack gap="sm">
            <Typography variant="small">
              公開するには、あと次の項目が必要です。
            </Typography>
            <div className="flex flex-wrap gap-2">
              {missingRequirements.map((requirement) => (
                <Badge key={requirement} variant="outline">
                  {requirement}
                </Badge>
              ))}
            </div>
          </Stack>
        )}

        {error && (
          <Typography variant="small" tone="danger">
            {error}
          </Typography>
        )}

        <div>
          {published ? (
            <Button
              variant="outline"
              onClick={onUnpublish}
              disabled={isLoading}
            >
              {isLoading ? "更新中..." : "非公開にする"}
            </Button>
          ) : (
            <Button onClick={onPublish} disabled={isLoading || !canPublish}>
              {isLoading ? "更新中..." : "公開する"}
            </Button>
          )}
        </div>
      </Stack>
    </Card>
  );
};
ProfilePublishControl.displayName = "ProfilePublishControl";
