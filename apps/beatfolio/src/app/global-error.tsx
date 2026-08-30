"use client";

import { routes } from "../utils/config/routes";
import { FailureScreen } from "./shared/FailureScreen";
import "./globals.css";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: Props) {
  return (
    <html lang="ja">
      <body className="bg-black text-white">
        <FailureScreen
          title="問題が発生しました"
          message="画面の表示中に問題が発生しました。再試行しても直らない場合は、時間をおいてお試しください。"
          retry={{ label: "再試行する", onRetry: reset }}
          links={[{ href: routes.home, label: "トップへ戻る" }]}
        />
      </body>
    </html>
  );
}
