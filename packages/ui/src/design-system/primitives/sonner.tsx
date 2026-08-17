"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, ToasterProps } from "sonner";

type CustomProperties = Record<`--${string}`, string>;

const toasterStyle: CSSProperties & CustomProperties = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--border)",
};

const Toaster = ({ ...props }: ToasterProps) => {
  return <Sonner className="toaster group" style={toasterStyle} {...props} />;
};

export { Toaster };
