import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@ui/shared/utils/mergeClassNames";

const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "text-4xl font-extrabold tracking-tight lg:text-5xl",
      h2: "text-3xl font-semibold tracking-tight",
      h3: "text-2xl font-semibold tracking-tight",
      h4: "text-xl font-semibold tracking-tight",
      // 導入文・ダイアログ説明など、本文より目立たせたい一段大きな文章 (20px)
      lead: "text-xl",
      // 標準の本文段落 (16px)
      p: "text-base leading-7",
      // フォームのキャプション・ヒント・エラーメッセージなど補助的な文 (12px)
      small: "text-xs",
    },
    tone: {
      default: "text-white",
      muted: "text-muted-foreground",
      danger: "text-destructive",
    },
  },
  defaultVariants: {
    tone: "default",
  },
});

type Variant = NonNullable<VariantProps<typeof typographyVariants>["variant"]>;

type VariantElementProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "className"
> & {
  className: string;
};

const variantElementMap: Record<
  Variant,
  (props: VariantElementProps) => React.JSX.Element
> = {
  h1: (props) => <h1 {...props} />,
  h2: (props) => <h2 {...props} />,
  h3: (props) => <h3 {...props} />,
  h4: (props) => <h4 {...props} />,
  lead: (props) => <p {...props} />,
  p: (props) => <p {...props} />,
  small: (props) => <p {...props} />,
};

export type TypographyProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "className"
> & {
  variant: Variant;
  tone?: NonNullable<VariantProps<typeof typographyVariants>["tone"]>;
};

export const Typography = ({ variant, tone, ...props }: TypographyProps) => {
  const Component = variantElementMap[variant];
  return (
    <Component
      className={cn(typographyVariants({ variant, tone }))}
      {...props}
    />
  );
};

export { typographyVariants };
