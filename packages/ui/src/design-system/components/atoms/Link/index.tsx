import React from "react";

type LinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export type { LinkProps };

export const Link = ({
  href,
  children,
  disabled = false,
  ...props
}: LinkProps) => (
  <a href={disabled ? "#" : href} aria-disabled={disabled} {...props}>
    {children}
  </a>
);
