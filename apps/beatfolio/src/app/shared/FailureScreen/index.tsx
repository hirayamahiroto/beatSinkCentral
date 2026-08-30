import Link from "next/link";
import { FailureNotice } from "@ui/design-system/components/molecules/FailureNotice";

type Props = {
  title: string;
  message: string;
  retry?: { label: string; onRetry: () => void };
  links: { href: string; label: string }[];
};

const renderLink = ({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <Link href={href} className={className}>
    {children}
  </Link>
);

export const FailureScreen = ({ title, message, retry, links }: Props) => (
  <div className="min-h-screen bg-background text-foreground px-4 pb-16 pt-24">
    <div className="container mx-auto max-w-3xl">
      <FailureNotice
        title={title}
        message={message}
        retry={retry}
        links={links}
        renderLink={renderLink}
      />
    </div>
  </div>
);
