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
  onClick,
  ...props
}: LinkProps) => (
  <a
    href={disabled ? undefined : href}
    aria-disabled={disabled}
    onClick={disabled ? (e) => e.preventDefault() : onClick}
    tabIndex={disabled ? -1 : undefined}
    {...props}
  >
    {children}
  </a>
);
