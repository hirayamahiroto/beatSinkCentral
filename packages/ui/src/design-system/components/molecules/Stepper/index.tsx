import React from "react";
import { Typography } from "@ui/design-system/components/atoms/Typography";
import { cn } from "@ui/shared/utils/mergeClassNames";

type StepperProps = {
  // 各ステップの短いラベル
  steps: string[];
  // 現在のステップ（1始まり）
  current: number;
};

export type { StepperProps };

// 登録ウィザードの進捗インジケータ。何がどこまで必要かを可視化する。
export const Stepper = ({ steps, current }: StepperProps) => (
  <ol className="flex items-center gap-1">
    {steps.map((label, index) => {
      const step = index + 1;
      const isDone = step < current;
      const isCurrent = step === current;

      return (
        <li key={label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
              isDone && "bg-primary text-primary-foreground",
              isCurrent && "bg-primary/20 text-foreground ring-1 ring-ring",
              !isDone && !isCurrent && "bg-white/5 text-muted-foreground",
            )}
          >
            {isDone ? "✓" : step}
          </div>
          <Typography variant="small" tone={isCurrent ? "default" : "muted"}>
            {label}
          </Typography>
        </li>
      );
    })}
  </ol>
);
Stepper.displayName = "Stepper";
