import React from "react";
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

const radioIndexByKey = (
  key: string,
  current: number,
  length: number,
): number | null => {
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return (current + 1) % length;
    case "ArrowLeft":
    case "ArrowUp":
      return (current - 1 + length) % length;
    case "Home":
      return 0;
    case "End":
      return length - 1;
    default:
      return null;
  }
};

export const PresentationPatternSelector = ({
  options,
  selectedCode,
  previewHref,
  isLoading,
  error,
  onSelect,
}: PresentationPatternSelectorProps) => {
  const radios = React.useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex(
    (option) => option.code === selectedCode,
  );
  const tabStopIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const moveSelection = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    current: number,
  ) => {
    const next = radioIndexByKey(event.key, current, options.length);
    if (next === null) return;
    event.preventDefault();
    radios.current[next]?.focus();
    onSelect(options[next].code);
  };

  return (
    <Card>
      <Stack gap="md">
        <Typography variant="h4">コンセプトページの見せ方</Typography>
        <Typography variant="small" tone="muted">
          Story
          を没入型で読ませるコンセプトページの表現を選びます。選んだ内容はすぐに公開ページへ反映されます。
        </Typography>

        <div className="flex flex-wrap gap-2" role="radiogroup">
          {options.map((option, index) => {
            const selected = option.code === selectedCode;
            return (
              <Button
                key={option.code}
                ref={(element) => {
                  radios.current[index] = element;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={index === tabStopIndex ? 0 : -1}
                variant={selected ? "default" : "outline"}
                disabled={isLoading}
                onClick={() => onSelect(option.code)}
                onKeyDown={(event) => moveSelection(event, index)}
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
};
PresentationPatternSelector.displayName = "PresentationPatternSelector";
