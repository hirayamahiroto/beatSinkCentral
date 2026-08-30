"use client";

import { useRouter } from "next/navigation";
import type { Feedback } from "../../../feedback";
import { routes } from "../../../utils/config/routes";
import { FailureScreen } from "../FailureScreen";

const TITLE = "読み込めませんでした";
const HOME_LINK = { href: routes.home, label: "トップへ戻る" };

type Props = {
  feedback: Feedback;
};

export const DegradedScreen = ({ feedback }: Props) => {
  const router = useRouter();
  const { message, recovery } = feedback;

  const links =
    recovery.kind === "navigate"
      ? [{ href: recovery.to, label: recovery.label }, HOME_LINK]
      : [HOME_LINK];

  return (
    <FailureScreen
      title={TITLE}
      message={message}
      retry={
        recovery.kind === "retry"
          ? { label: "再試行する", onRetry: () => router.refresh() }
          : undefined
      }
      links={links}
    />
  );
};
