import React from "react";
import { Card } from "@ui/design-system/components/atoms/Card";
import { Stack } from "@ui/design-system/components/atoms/Stack";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Typography } from "@ui/design-system/components/atoms/Typography";

type FailureNoticeLink = {
  href: string;
  label: string;
};

type FailureNoticeRetry = {
  label: string;
  onRetry: () => void;
};

type FailureNoticeProps = {
  title: string;
  message: string;
  retry?: FailureNoticeRetry;
  links: FailureNoticeLink[];
  renderLink: (props: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => React.ReactNode;
};

export type { FailureNoticeProps, FailureNoticeLink, FailureNoticeRetry };

export const FailureNotice = ({
  title,
  message,
  retry,
  links,
  renderLink,
}: FailureNoticeProps) => (
  <Card>
    <Stack gap="md">
      <div role="alert">
        <Stack gap="sm">
          <Typography variant="h4">{title}</Typography>
          <Typography variant="small" tone="muted">
            {message}
          </Typography>
        </Stack>
      </div>

      <div className="flex flex-wrap gap-3">
        {retry && <Button onClick={retry.onRetry}>{retry.label}</Button>}
        {links.map((link) => (
          <Button key={link.href} asChild variant="outline">
            {renderLink({ href: link.href, children: link.label })}
          </Button>
        ))}
      </div>
    </Stack>
  </Card>
);
FailureNotice.displayName = "FailureNotice";
