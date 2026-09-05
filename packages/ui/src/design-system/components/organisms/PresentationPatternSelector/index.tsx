import { Button } from "@ui/design-system/components/atoms/Button";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Link } from "@ui/design-system/components/atoms/Link";
import { Stack } from "@ui/design-system/components/atoms/Stack";
import { Typography } from "@ui/design-system/components/atoms/Typography";

export type PresentationPatternOption = {
  code: string;
  label: string;
};

type PresentationPatternSelectorProps = {
  options: PresentationPatternOption[];
  selectedCode: string | null;
  previewHref: string | null;
  isLoading: boolean;
  error: string | null;
  onSelect: (code: string) => void;
};

export const PresentationPatternSelector = ({
  options,
  selectedCode,
  previewHref,
  isLoading,
  error,
  onSelect,
}: PresentationPatternSelectorProps) => (
  <Card>
    <Stack gap="md">
      <Typography variant="h4">コンセプトページの見せ方</Typography>
      <Typography variant="small" tone="muted">
        Story
        を没入型で読ませるコンセプトページの表現を選びます。選んだ内容はすぐに公開ページへ反映されます。
      </Typography>

      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map((option) => {
          const selected = option.code === selectedCode;
          return (
            <Button
              key={option.code}
              type="button"
              role="radio"
              aria-checked={selected}
              variant={selected ? "default" : "outline"}
              disabled={isLoading}
              onClick={() => onSelect(option.code)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>

      {error && (
        <div role="alert">
          <Typography variant="small" tone="danger">
            {error}
          </Typography>
        </div>
      )}

      {previewHref && (
        <div>
          <Button asChild variant="ghost">
            <Link href={previewHref}>コンセプトページを見る</Link>
          </Button>
        </div>
      )}
    </Stack>
  </Card>
);
PresentationPatternSelector.displayName = "PresentationPatternSelector";
