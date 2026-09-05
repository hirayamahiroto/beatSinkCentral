"use client";

import {
  PresentationPatternSelector,
  type PresentationPatternOption,
} from "@ui/design-system/components/organisms/PresentationPatternSelector";
import { useChoosePresentationPattern } from "./hooks/useChoosePresentationPattern";

type Props = {
  options: PresentationPatternOption[];
  selectedCode: string | null;
  previewHref: string | null;
};

export const PresentationPatternClientAdapter = ({
  options,
  selectedCode,
  previewHref,
}: Props) => {
  const { choose, isLoading, error } = useChoosePresentationPattern();

  return (
    <PresentationPatternSelector
      options={options}
      selectedCode={selectedCode}
      previewHref={previewHref}
      isLoading={isLoading}
      error={error}
      onSelect={(code) => {
        void choose(code);
      }}
    />
  );
};
